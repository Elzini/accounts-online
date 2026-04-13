import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DaftraAction {
  action: 'authenticate' | 'sync_accounts' | 'sync_journals' | 'sync_clients' | 'sync_suppliers' | 'test_connection' | 'get_accounts';
  companyId: string;
  data?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body: DaftraAction = await req.json()
    const { action, companyId, data } = body

    if (!companyId) {
      return jsonResponse({ error: 'companyId is required' }, 400)
    }

    // Get Daftra config for this company
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: config, error: configErr } = await serviceClient
      .from('daftra_integrations')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (configErr && action !== 'authenticate') {
      return jsonResponse({ error: 'Daftra integration not configured', details: configErr.message }, 404)
    }

    switch (action) {
      case 'authenticate':
        return await handleAuthenticate(serviceClient, companyId, data)
      case 'test_connection':
        return await handleTestConnection(config)
      case 'get_accounts':
        return await handleGetAccounts(config)
      case 'sync_accounts':
        return await handleSyncAccounts(serviceClient, config, companyId, data)
      case 'sync_journals':
        return await handleSyncJournals(serviceClient, config, companyId, data)
      case 'sync_clients':
        return await handleSyncClients(serviceClient, config, companyId, data)
      case 'sync_suppliers':
        return await handleSyncSuppliers(serviceClient, config, companyId, data)
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    console.error('Daftra API error:', err)
    return jsonResponse({ error: err.message || 'Internal error' }, 500)
  }
})

// ===================== HELPERS =====================

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function daftraBaseUrl(subdomain: string) {
  return `https://${subdomain}.daftra.com`
}

function normalizeAccountCode(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, '')
}

function normalizeAccountName(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function extractDaftraAccounts(payload: any) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.accounts)) return payload.accounts
  if (Array.isArray(payload?.JournalAccount)) return payload.JournalAccount
  if (Array.isArray(payload)) return payload
  return []
}

function getDaftraAccountIdentity(rawAccount: any) {
  const account = rawAccount?.JournalAccount || rawAccount || {}
  return {
    raw: rawAccount,
    id: String(account?.id ?? '').trim(),
    code: normalizeAccountCode(account?.code),
    name: normalizeAccountName(account?.name),
  }
}

function parseDaftraError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const jsonMatch = message.match(/\{[\s\S]*\}$/)
  if (!jsonMatch) return null

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

function isDaftraDuplicateCodeError(error: unknown) {
  return parseDaftraError(error)?.validation_errors?.code === 'Code already exists'
}

async function daftraFetch(config: any, path: string, method = 'GET', body?: any) {
  const url = `${daftraBaseUrl(config.subdomain)}${path}`
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  if (config.access_token_encrypted) {
    headers['Authorization'] = `Bearer ${config.access_token_encrypted}`
  }

  const opts: RequestInit = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  console.log(`[Daftra] ${method} ${url}`)
  if (body) console.log(`[Daftra] Body:`, JSON.stringify(body).substring(0, 500))
  
  const res = await fetch(url, opts)
  const text = await res.text()

  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }

  console.log(`[Daftra] Response ${res.status}:`, JSON.stringify(json).substring(0, 500))

  if (!res.ok) {
    throw new Error(`Daftra API ${res.status}: ${JSON.stringify(json)}`)
  }

  return json
}

// ===================== AUTHENTICATE =====================

async function handleAuthenticate(supabase: any, companyId: string, data: any) {
  const { subdomain, clientId, clientSecret, username, password } = data || {}

  if (!subdomain || !clientId || !clientSecret || !username || !password) {
    return jsonResponse({ error: 'All fields required: subdomain, clientId, clientSecret, username, password' }, 400)
  }

  // Get OAuth token from Daftra
  const formData = new FormData()
  formData.append('client_secret', clientSecret)
  formData.append('client_id', clientId)
  formData.append('grant_type', 'password')
  formData.append('username', username)
  formData.append('password', password)

  const tokenRes = await fetch(`${daftraBaseUrl(subdomain)}/v2/oauth/token`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: formData,
  })

  const tokenText = await tokenRes.text()
  let tokenData
  try { tokenData = JSON.parse(tokenText) } catch { tokenData = { raw: tokenText } }

  if (!tokenRes.ok || !tokenData.access_token) {
    return jsonResponse({
      error: 'Authentication failed',
      details: tokenData,
    }, 401)
  }

  // Store config (upsert)
  const { error: upsertErr } = await supabase
    .from('daftra_integrations')
    .upsert({
      company_id: companyId,
      subdomain,
      client_id: clientId,
      client_secret_encrypted: clientSecret,
      username_encrypted: username,
      password_encrypted: password,
      access_token_encrypted: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      is_active: true,
      sync_status: 'connected',
    }, { onConflict: 'company_id' })

  if (upsertErr) {
    return jsonResponse({ error: 'Failed to save config', details: upsertErr.message }, 500)
  }

  return jsonResponse({ success: true, message: 'Connected to Daftra successfully' })
}

// ===================== TEST CONNECTION =====================

async function handleTestConnection(config: any) {
  try {
    const result = await daftraFetch(config, '/api2/site_info.json')
    return jsonResponse({ success: true, site: result })
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 400)
  }
}

// ===================== GET ACCOUNTS =====================

async function fetchAllDaftraAccounts(config: any) {
  let allAccounts: any[] = []
  const seenPageFingerprints = new Set<string>()
  const seenAccountKeys = new Set<string>()

  for (let page = 1; page <= 200; page++) {
    const result = await daftraFetch(config, `/api2/journal_accounts.json?page=${page}`)
    const accounts = extractDaftraAccounts(result)

    if (!accounts.length) break

    const pageFingerprint = accounts
      .map((account: any) => {
        const identity = getDaftraAccountIdentity(account)
        return identity.id || identity.code || identity.name || JSON.stringify(account)
      })
      .join('|')

    if (seenPageFingerprints.has(pageFingerprint)) break
    seenPageFingerprints.add(pageFingerprint)

    let addedOnPage = 0
    for (const account of accounts) {
      const identity = getDaftraAccountIdentity(account)
      const key = identity.id ? `id:${identity.id}` : identity.code ? `code:${identity.code}` : identity.name ? `name:${identity.name}` : JSON.stringify(account)
      if (seenAccountKeys.has(key)) continue
      seenAccountKeys.add(key)
      allAccounts.push(account)
      addedOnPage++
    }

    const pagination = result?.pagination || result?.meta?.pagination || result?.pager || null
    const currentPage = Number(pagination?.current_page ?? pagination?.page ?? page)
    const totalPages = Number(pagination?.total_pages ?? pagination?.last_page ?? pagination?.pages ?? 0)

    if (totalPages && currentPage >= totalPages) break
    if (addedOnPage === 0) break
  }

  return allAccounts
}

async function handleGetAccounts(config: any) {
  try {
    const accounts = await fetchAllDaftraAccounts(config)
    return jsonResponse({ success: true, accounts })
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 400)
  }
}

// ===================== SYNC ACCOUNTS =====================

async function handleSyncAccounts(supabase: any, config: any, companyId: string, data: any) {
  const accounts = data?.accounts || []
  if (!accounts.length) {
    return jsonResponse({ error: 'No accounts provided' }, 400)
  }

  // Fetch existing accounts from Daftra to skip duplicates
  let existingCodes: Set<string> = new Set()
  try {
    const existing = await fetchAllDaftraAccounts(config)
    for (const acc of existing) {
      const { code } = getDaftraAccountIdentity(acc)
      if (code) existingCodes.add(String(code))
    }
    console.log(`[Daftra] Found ${existingCodes.size} existing accounts in Daftra`)
  } catch (err) {
    console.log(`[Daftra] Could not fetch existing accounts, proceeding with all: ${err.message}`)
  }

  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const account of accounts) {
    const normalizedCode = normalizeAccountCode(account.code)

    // Skip if code already exists in Daftra
    if (normalizedCode && existingCodes.has(normalizedCode)) {
      results.push({ code: account.code, name: account.name, status: 'skipped', reason: 'موجود مسبقاً في دفترة' })
      skippedCount++
      continue
    }

    try {
      const payload = {
        JournalAccount: {
          name: account.name,
          code: normalizedCode || account.code,
          type: mapAccountType(account.type),
          description: account.description || '',
          parent_id: account.parent_daftra_id || null,
        },
      }

      const result = await daftraFetch(config, '/api2/journal_accounts.json', 'POST', payload)
      if (normalizedCode) existingCodes.add(normalizedCode)
      results.push({ code: account.code, name: account.name, status: 'success', daftra_id: result.id })
      successCount++
    } catch (err) {
      if (isDaftraDuplicateCodeError(err)) {
        if (normalizedCode) existingCodes.add(normalizedCode)
        results.push({ code: account.code, name: account.name, status: 'skipped', reason: 'موجود مسبقاً في دفترة' })
        skippedCount++
        continue
      }

      results.push({ code: account.code, name: account.name, status: 'error', error: err.message })
      errorCount++
    }
  }

  await supabase.from('daftra_integrations').update({
    last_sync_at: new Date().toISOString(),
    sync_status: errorCount === 0 ? 'synced' : 'partial',
    sync_log: { accounts: { success: successCount, errors: errorCount, skipped: skippedCount, details: results } },
  }).eq('company_id', companyId)

  return jsonResponse({ success: true, synced: successCount, errors: errorCount, skipped: skippedCount, details: results })
}

// ===================== SYNC JOURNALS =====================

async function handleSyncJournals(supabase: any, config: any, companyId: string, data: any) {
  const entries = data?.entries || []
  if (!entries.length) {
    return jsonResponse({ error: 'No journal entries provided' }, 400)
  }

  // Build name→id map from Daftra accounts
  let accountNameToId: Map<string, string> = new Map()
  let accountCodeToId: Map<string, string> = new Map()
  try {
    const daftraAccounts = await fetchAllDaftraAccounts(config)
    for (const acc of daftraAccounts) {
      const a = acc?.JournalAccount || acc
      const normalizedName = normalizeAccountName(a?.name)
      const normalizedCode = normalizeAccountCode(a?.code)
      if (a?.id && normalizedName) accountNameToId.set(normalizedName, String(a.id))
      if (a?.id && normalizedCode) accountCodeToId.set(normalizedCode, String(a.id))
    }
    console.log(`[Daftra] Loaded ${accountNameToId.size} account mappings for journal sync`)
  } catch (err) {
    console.error(`[Daftra] Failed to load accounts for mapping: ${err.message}`)
    return jsonResponse({ error: 'فشل في جلب حسابات دفترة لربط القيود', details: err.message }, 500)
  }

  const results: any[] = []
  let successCount = 0
  let errorCount = 0

  for (const entry of entries) {
    try {
      const transactions = (entry.lines || []).map((line: any) => {
        const name = normalizeAccountName(line.account_name)
        const code = normalizeAccountCode(line.account_code)
        // Try name first, then code
        const daftraId = accountNameToId.get(name) || accountCodeToId.get(code) || ''
        if (!daftraId) {
          console.log(`[Daftra] No mapping found for account: "${name}" (code: "${code}")`)
        }
        return {
          journal_id: 0,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          journal_account_id: daftraId,
          description: line.description || entry.description || '',
          currency_code: entry.currency || 'SAR',
        }
      })

      // Check if any transaction is missing account mapping
      const unmapped = transactions.filter((t: any) => !t.journal_account_id)
      if (unmapped.length > 0) {
        const missingNames = (entry.lines || [])
          .filter((_: any, i: number) => !transactions[i].journal_account_id)
          .map((l: any) => l.account_name)
        results.push({
          entry_number: entry.entry_number,
          status: 'error',
          error: `حسابات غير موجودة في دفترة: ${missingNames.join(', ')}`,
        })
        errorCount++
        continue
      }

      const totalDebit = transactions.reduce((s: number, t: any) => s + t.debit, 0)
      const totalCredit = transactions.reduce((s: number, t: any) => s + t.credit, 0)

      const payload = {
        Journal: {
          description: entry.description || `قيد رقم ${entry.entry_number}`,
          entity_type: 'expense',
          entity_id: String(entry.entry_number || '0'),
          total_debit: totalDebit,
          total_credit: totalCredit,
          currency_code: entry.currency || 'SAR',
          staff_id: 1,
        },
        JournalTransaction: transactions,
      }

      const result = await daftraFetch(config, '/api2/journals.json', 'POST', payload)
      results.push({ entry_number: entry.entry_number, status: 'success', daftra_id: result.id })
      successCount++
    } catch (err) {
      results.push({ entry_number: entry.entry_number, status: 'error', error: err.message })
      errorCount++
    }
  }

  await supabase.from('daftra_integrations').update({
    last_sync_at: new Date().toISOString(),
    sync_status: errorCount === 0 ? 'synced' : 'partial',
    sync_log: { journals: { success: successCount, errors: errorCount, details: results } },
  }).eq('company_id', companyId)

  return jsonResponse({ success: true, synced: successCount, errors: errorCount, details: results })
}

// ===================== SYNC CLIENTS =====================

async function handleSyncClients(supabase: any, config: any, companyId: string, data: any) {
  const clients = data?.clients || []
  if (!clients.length) {
    return jsonResponse({ error: 'No clients provided' }, 400)
  }

  const results: any[] = []
  let successCount = 0
  let errorCount = 0

  for (const client of clients) {
    try {
      const payload = {
        Client: {
          first_name: client.name || '',
          email: client.email || '',
          phone1: client.phone || '',
          address1: client.address || '',
          tax_number: client.tax_number || '',
        },
      }

      const result = await daftraFetch(config, '/api2/clients.json', 'POST', payload)
      results.push({ name: client.name, status: 'success', daftra_id: result.id })
      successCount++
    } catch (err) {
      results.push({ name: client.name, status: 'error', error: err.message })
      errorCount++
    }
  }

  await supabase.from('daftra_integrations').update({
    last_sync_at: new Date().toISOString(),
    sync_log: { clients: { success: successCount, errors: errorCount } },
  }).eq('company_id', companyId)

  return jsonResponse({ success: true, synced: successCount, errors: errorCount, details: results })
}

// ===================== SYNC SUPPLIERS =====================

async function handleSyncSuppliers(supabase: any, config: any, companyId: string, data: any) {
  const suppliers = data?.suppliers || []
  if (!suppliers.length) {
    return jsonResponse({ error: 'No suppliers provided' }, 400)
  }

  const results: any[] = []
  let successCount = 0
  let errorCount = 0

  for (const supplier of suppliers) {
    try {
      const payload = {
        Supplier: {
          first_name: supplier.name || '',
          email: supplier.email || '',
          phone1: supplier.phone || '',
          address1: supplier.address || '',
          tax_number: supplier.tax_number || '',
        },
      }

      const result = await daftraFetch(config, '/api2/suppliers.json', 'POST', payload)
      results.push({ name: supplier.name, status: 'success', daftra_id: result.id })
      successCount++
    } catch (err) {
      results.push({ name: supplier.name, status: 'error', error: err.message })
      errorCount++
    }
  }

  await supabase.from('daftra_integrations').update({
    last_sync_at: new Date().toISOString(),
    sync_log: { suppliers: { success: successCount, errors: errorCount } },
  }).eq('company_id', companyId)

  return jsonResponse({ success: true, synced: successCount, errors: errorCount, details: results })
}

// ===================== UTILS =====================

function mapAccountType(type: string): number {
  // Daftra account types: 1=Assets, 2=Liabilities, 3=Equity, 4=Revenue, 5=Expenses
  const map: Record<string, number> = {
    'asset': 1, 'assets': 1,
    'liability': 2, 'liabilities': 2,
    'equity': 3,
    'revenue': 4, 'income': 4,
    'expense': 5, 'expenses': 5,
  }
  return map[type?.toLowerCase()] || 1
}
