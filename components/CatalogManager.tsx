import React, { useState, useMemo } from 'react';
import { Button, Input, Table, Modal, Badge, Card, Select, Tabs } from './UIComponents';
import { Plus, Edit, Trash2, Package, AlertTriangle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, ProductVariant, ProductLot } from '../types';

interface CatalogManagerProps {
  product: Product;
  onSave: (product: Product) => void;
  onClose: () => void;
  settings: any;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ product, onSave, onClose, settings }) => {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({});
  const [newLot, setNewLot] = useState<Partial<ProductLot>>({});

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  const totalStock = useMemo(() => {
    return variants.reduce((acc, v) => acc + v.stock, 0);
  }, [variants]);

  const totalValue = useMemo(() => {
    return variants.reduce((acc, v) => acc + (v.stock * (v.costPrice || 0)), 0);
  }, [variants]);

  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.sku) {
      alert('Please fill in variant name and SKU');
      return;
    }
    const variant: ProductVariant = {
      id: Date.now().toString(),
      name: newVariant.name,
      sku: newVariant.sku,
      price: newVariant.price || product.price,
      costPrice: newVariant.costPrice || product.costPrice,
      stock: newVariant.stock || 0,
      lots: []
    };
    setVariants([...variants, variant]);
    setNewVariant({});
    setIsAddingVariant(false);
    setSelectedVariantId(variant.id);
  };

  const handleAddLot = () => {
    if (!selectedVariant || !newLot.lotNumber || newLot.quantity === undefined) {
      alert('Please fill in lot number and quantity');
      return;
    }

    const lot: ProductLot = {
      id: Date.now().toString(),
      lotNumber: newLot.lotNumber,
      quantity: newLot.quantity,
      expiryDate: newLot.expiryDate,
      manufacturingDate: newLot.manufacturingDate,
      costPrice: newLot.costPrice || selectedVariant.costPrice || 0,
      receivedDate: newLot.receivedDate || new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    const updatedVariants = variants.map(v => {
      if (v.id === selectedVariant.id) {
        const lots = v.lots || [];
        const totalQuantity = lots.reduce((acc, l) => acc + l.quantity, 0) + lot.quantity;
        return {
          ...v,
          lots: [...lots, lot],
          stock: totalQuantity
        };
      }
      return v;
    });

    setVariants(updatedVariants);
    setNewLot({});
    setIsAddingLot(false);
  };

  const handleDeleteVariant = (variantId: string) => {
    setVariants(variants.filter(v => v.id !== variantId));
    if (selectedVariantId === variantId) {
      setSelectedVariantId(null);
    }
  };

  const handleDeleteLot = (lotId: string) => {
    if (!selectedVariant) return;

    const updatedVariants = variants.map(v => {
      if (v.id === selectedVariant.id && v.lots) {
        const deletedLot = v.lots.find(l => l.id === lotId);
        const newStock = v.stock - (deletedLot?.quantity || 0);
        return {
          ...v,
          lots: v.lots.filter(l => l.id !== lotId),
          stock: newStock
        };
      }
      return v;
    });

    setVariants(updatedVariants);
  };

  const handleUpdateLot = (lotId: string, updates: Partial<ProductLot>) => {
    if (!selectedVariant) return;

    const updatedVariants = variants.map(v => {
      if (v.id === selectedVariant.id && v.lots) {
        const oldQuantity = v.lots.find(l => l.id === lotId)?.quantity || 0;
        const newQuantity = updates.quantity !== undefined ? updates.quantity : oldQuantity;
        const quantityDiff = newQuantity - oldQuantity;

        return {
          ...v,
          lots: v.lots.map(l => l.id === lotId ? { ...l, ...updates } : l),
          stock: v.stock + quantityDiff
        };
      }
      return v;
    });

    setVariants(updatedVariants);
  };

  const toggleVariantExpanded = (variantId: string) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(variantId)) {
      newExpanded.delete(variantId);
    } else {
      newExpanded.add(variantId);
    }
    setExpandedVariants(newExpanded);
  };

  const handleSave = () => {
    const updatedProduct = {
      ...product,
      variants,
      stock: totalStock
    };
    onSave(updatedProduct);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Catalog Manager - ${product.name}`}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-primary-600 uppercase">Total Stock</p>
                <h3 className="text-2xl font-bold text-primary-700">{totalStock}</h3>
              </div>
              <Package size={20} className="text-primary-500" />
            </div>
          </Card>
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Value</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{settings.currencySymbol}{totalValue.toFixed(2)}</h3>
              </div>
              <AlertTriangle size={20} className="text-slate-400" />
            </div>
          </Card>
        </div>

        {/* Variants Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Variants</h3>
            <Button onClick={() => setIsAddingVariant(true)} icon={<Plus size={16} />} size="sm">Add Variant</Button>
          </div>

          {isAddingVariant && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
              <Input
                label="Variant Name"
                placeholder="e.g., Red XL, Size M, etc."
                value={newVariant.name || ''}
                onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
              />
              <Input
                label="Variant SKU"
                placeholder="Unique SKU for this variant"
                value={newVariant.sku || ''}
                onChange={e => setNewVariant({ ...newVariant, sku: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price"
                  type="number"
                  value={newVariant.price?.toString() || ''}
                  onChange={e => setNewVariant({ ...newVariant, price: Number(e.target.value) })}
                />
                <Input
                  label="Cost Price"
                  type="number"
                  value={newVariant.costPrice?.toString() || ''}
                  onChange={e => setNewVariant({ ...newVariant, costPrice: Number(e.target.value) })}
                />
              </div>
              <Input
                label="Initial Stock"
                type="number"
                value={newVariant.stock?.toString() || ''}
                onChange={e => setNewVariant({ ...newVariant, stock: Number(e.target.value) })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => { setIsAddingVariant(false); setNewVariant({}); }}>Cancel</Button>
                <Button size="sm" onClick={handleAddVariant}>Create Variant</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {variants.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package size={24} className="mx-auto mb-2 opacity-50" />
                <p>No variants yet. Create one to start managing lots.</p>
              </div>
            ) : (
              variants.map(variant => (
                <div key={variant.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  {/* Variant Header */}
                  <div
                    onClick={() => toggleVariantExpanded(variant.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-between items-center ${
                      selectedVariantId === variant.id ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button className="p-0">
                        {expandedVariants.has(variant.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{variant.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{variant.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-slate-500">Stock</p>
                        <p className="font-bold text-slate-900 dark:text-white">{variant.stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Price</p>
                        <p className="font-bold text-primary-600">{settings.currencySymbol}{variant.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedVariantId(variant.id);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteVariant(variant.id);
                          }}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Lot Details */}
                  {expandedVariants.has(variant.id) && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 dark:text-white">Lot Numbers</h4>
                        {variant.id === selectedVariantId && (
                          <Button
                            onClick={() => setIsAddingLot(true)}
                            icon={<Plus size={14} />}
                            size="sm"
                            variant="secondary"
                          >
                            Add Lot
                          </Button>
                        )}
                      </div>

                      {/* Add Lot Form */}
                      {variant.id === selectedVariantId && isAddingLot && (
                        <div className="bg-white dark:bg-slate-700 p-3 rounded-lg space-y-3 border border-slate-200 dark:border-slate-600">
                          <Input
                            label="Lot Number"
                            placeholder="e.g., LOT-2024-001"
                            value={newLot.lotNumber || ''}
                            onChange={e => setNewLot({ ...newLot, lotNumber: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Quantity"
                              type="number"
                              value={newLot.quantity?.toString() || ''}
                              onChange={e => setNewLot({ ...newLot, quantity: Number(e.target.value) })}
                            />
                            <Input
                              label="Cost Price"
                              type="number"
                              value={newLot.costPrice?.toString() || ''}
                              onChange={e => setNewLot({ ...newLot, costPrice: Number(e.target.value) })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Manufacturing Date"
                              type="date"
                              value={newLot.manufacturingDate || ''}
                              onChange={e => setNewLot({ ...newLot, manufacturingDate: e.target.value })}
                            />
                            <Input
                              label="Expiry Date"
                              type="date"
                              value={newLot.expiryDate || ''}
                              onChange={e => setNewLot({ ...newLot, expiryDate: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="secondary" size="sm" onClick={() => { setIsAddingLot(false); setNewLot({}); }}>Cancel</Button>
                            <Button size="sm" onClick={handleAddLot}>Add Lot</Button>
                          </div>
                        </div>
                      )}

                      {/* Lots Table */}
                      {variant.lots && variant.lots.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-600">
                                <th className="text-left py-2 px-3 font-bold text-slate-900 dark:text-white">Lot Number</th>
                                <th className="text-right py-2 px-3 font-bold text-slate-900 dark:text-white">Qty</th>
                                <th className="text-right py-2 px-3 font-bold text-slate-900 dark:text-white">Cost</th>
                                <th className="text-center py-2 px-3 font-bold text-slate-900 dark:text-white">Exp Date</th>
                                <th className="text-center py-2 px-3 font-bold text-slate-900 dark:text-white">Status</th>
                                <th className="text-right py-2 px-3 font-bold text-slate-900 dark:text-white">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {variant.lots.map(lot => (
                                <tr key={lot.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700">
                                  <td className="py-2 px-3 font-mono text-slate-900 dark:text-white text-xs">{lot.lotNumber}</td>
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      value={lot.quantity}
                                      onChange={e => handleUpdateLot(lot.id, { quantity: Number(e.target.value) })}
                                      className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-right text-sm dark:bg-slate-600 dark:text-white"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                                    {settings.currencySymbol}{lot.costPrice.toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-center text-xs text-slate-500">
                                    {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <Badge variant={lot.status === 'Active' ? 'success' : lot.status === 'Expired' ? 'warning' : 'secondary'}>
                                      {lot.status}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      onClick={() => handleDeleteLot(lot.id)}
                                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center py-4 text-slate-500 text-sm">No lots. Add one to track inventory.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Catalog</Button>
        </div>
      </div>
    </Modal>
  );
};
