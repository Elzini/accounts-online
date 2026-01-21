import { useState } from 'react';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImportedInvoiceItem } from '@/services/importedInvoiceData';

interface ExcelItemsEditorProps {
  items: ImportedInvoiceItem[];
  onChange: (items: ImportedInvoiceItem[]) => void;
}

export function ExcelItemsEditor({ items, onChange }: ExcelItemsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<ImportedInvoiceItem | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditItem({ ...items[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editItem) {
      const newItems = [...items];
      newItems[editingIndex] = editItem;
      onChange(newItems);
      setEditingIndex(null);
      setEditItem(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditItem(null);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleAddNew = () => {
    const newItem: ImportedInvoiceItem = {
      description: 'بند جديد',
      quantity: 1,
      unitPrice: 0,
      taxRate: 15,
    };
    onChange([...items, newItem]);
    setEditingIndex(items.length);
    setEditItem(newItem);
  };

  const handleUpdateField = (field: keyof ImportedInvoiceItem, value: string | number) => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      [field]: field === 'description' ? value : Number(value) || 0,
    });
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-right font-medium border-b w-10">#</th>
                <th className="p-2 text-right font-medium border-b">الوصف</th>
                <th className="p-2 text-right font-medium border-b w-24">الكمية</th>
                <th className="p-2 text-right font-medium border-b w-32">سعر الوحدة</th>
                <th className="p-2 text-right font-medium border-b w-24">الضريبة %</th>
                <th className="p-2 text-right font-medium border-b w-32">الإجمالي</th>
                <th className="p-2 text-center font-medium border-b w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const isEditing = editingIndex === index;
                const total = item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100);

                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    <td className="p-2 border-b text-muted-foreground">{index + 1}</td>
                    <td className="p-2 border-b">
                      {isEditing ? (
                        <Input
                          value={editItem?.description || ''}
                          onChange={(e) => handleUpdateField('description', e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="p-2 border-b">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editItem?.quantity || 0}
                          onChange={(e) => handleUpdateField('quantity', e.target.value)}
                          className="h-8"
                          min={1}
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="p-2 border-b">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editItem?.unitPrice || 0}
                          onChange={(e) => handleUpdateField('unitPrice', e.target.value)}
                          className="h-8"
                          min={0}
                        />
                      ) : (
                        item.unitPrice.toLocaleString()
                      )}
                    </td>
                    <td className="p-2 border-b">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editItem?.taxRate || 0}
                          onChange={(e) => handleUpdateField('taxRate', e.target.value)}
                          className="h-8"
                          min={0}
                          max={100}
                        />
                      ) : (
                        `${item.taxRate || 0}%`
                      )}
                    </td>
                    <td className="p-2 border-b font-medium">
                      {isEditing
                        ? ((editItem?.quantity || 0) * (editItem?.unitPrice || 0) * (1 + ((editItem?.taxRate || 0) / 100))).toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border-b">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveEdit}
                              className="h-7 w-7 p-0 text-primary hover:text-primary"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-7 w-7 p-0 text-muted-foreground"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(index)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(index)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة بند
        </Button>
        <div className="text-sm text-muted-foreground">
          إجمالي: <span className="font-medium text-foreground">
            {items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100)), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ر.س
          </span>
        </div>
      </div>
    </div>
  );
}
