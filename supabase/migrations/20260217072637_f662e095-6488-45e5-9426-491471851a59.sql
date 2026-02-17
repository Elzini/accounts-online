
-- Fix chat_channels RLS: restrict to same company
DROP POLICY IF EXISTS "Users can manage chat_channels" ON public.chat_channels;

CREATE POLICY "Users can view company chat channels"
  ON public.chat_channels FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create company chat channels"
  ON public.chat_channels FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update company chat channels"
  ON public.chat_channels FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete company chat channels"
  ON public.chat_channels FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Fix chat_messages RLS: restrict to messages in user's company channels
DROP POLICY IF EXISTS "Users can manage chat_messages" ON public.chat_messages;

CREATE POLICY "Users can view company chat messages"
  ON public.chat_messages FOR SELECT
  USING (channel_id IN (
    SELECT id FROM chat_channels WHERE company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can send company chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (channel_id IN (
    SELECT id FROM chat_channels WHERE company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (sender_id = auth.uid());
