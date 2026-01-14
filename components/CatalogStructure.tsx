import React, { useState, useMemo } from 'react';
import { Button, Input, Table, Modal, Badge, Card, Select } from './UIComponents';
import { Plus, Edit, Trash2, Package, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Catalog, CatalogItem, ProductLot, ProductAttribute } from '../types';

interface CatalogStructureProps {
  catalog: Catalog | null;
  onSave: (catalog: Catalog) => void;
  onClose: () => void;
  settings: any;
}

export const CatalogStructure: React.FC<CatalogStructureProps> = ({ catalog, onSave, onClose, settings }) => {
  const [currentCatalog, setCurrentCatalog] = useState<Catalog>(catalog || {
    id: Date.now().toString(),
    name: '',
    brand: '',
    category: '',
    items: [],
    attributes: []
  });

  const [activeSection, setActiveSection] = useState<'catalog' | 'attributes' | 'items'>('catalog');
  const [newAttribute, setNewAttribute] = useState<Partial<ProductAttribute>>({ values: [] });
  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({});
  const [newLot, setNewLot] = useState<Partial<ProductLot>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [attributeValueInput, setAttributeValueInput] = useState('');

  const totalStock = useMemo(() => {
    return currentCatalog.items?.reduce((acc, item) => acc + item.stock, 0) || 0;
  }, [currentCatalog.items]);

  const totalValue = useMemo(() => {
    return currentCatalog.items?.reduce((acc, item) => acc + (item.stock * (item.costPrice || 0)), 0) || 0;
  }, [currentCatalog.items]);

  const handleAddAttribute = () => {
    if (!newAttribute.name || !newAttribute.values?.length) {
      alert('Please fill in attribute name and at least one value');
      return;
    }
    const attribute: ProductAttribute = {
      id: Date.now().toString(),
      name: newAttribute.name,
      values: newAttribute.values
    };
    setCurrentCatalog({
      ...currentCatalog,
      attributes: [...(currentCatalog.attributes || []), attribute]
    });
    setNewAttribute({ values: [] });
  };

  const handleAddAttributeValue = () => {
    if (!attributeValueInput) return;
    setNewAttribute({
      ...newAttribute,
      values: [...(newAttribute.values || []), attributeValueInput]
    });
    setAttributeValueInput('');
  };

  const handleRemoveAttributeValue = (index: number) => {
    const values = newAttribute.values?.filter((_, i) => i !== index) || [];
    setNewAttribute({ ...newAttribute, values });
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.sku) {
      alert('Please fill in item name and SKU');
      return;
    }
    const item: CatalogItem = {
      id: Date.now().toString(),
      catalogId: currentCatalog.id,
      itemId: `ITEM-${Date.now()}`,
      sku: newItem.sku,
      name: newItem.name,
      price: newItem.price || 0,
      costPrice: newItem.costPrice || 0,
      wholesalePrice: newItem.wholesalePrice,
      salePrice: newItem.salePrice,
      stock: newItem.stock || 0,
      location: newItem.location,
      lots: []
    };
    setCurrentCatalog({
      ...currentCatalog,
      items: [...(currentCatalog.items || []), item]
    });
    setNewItem({});
    setSelectedItemId(item.id);
  };

  const handleAddLot = () => {
    const items = currentCatalog.items || [];
    const selectedItem = items.find(i => i.id === selectedItemId);

    if (!selectedItem || !newLot.lotNumber || newLot.quantity === undefined) {
      alert('Please fill in lot number and quantity');
      return;
    }

    const lot: ProductLot = {
      id: Date.now().toString(),
      lotNumber: newLot.lotNumber,
      quantity: newLot.quantity,
      location: newLot.location,
      expiryDate: newLot.expiryDate,
      manufacturingDate: newLot.manufacturingDate,
      costPrice: newLot.costPrice || selectedItem.costPrice || 0,
      receivedDate: newLot.receivedDate || new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    const updatedItems = items.map(item => {
      if (item.id === selectedItem.id) {
        const lots = item.lots || [];
        const totalQuantity = lots.reduce((acc, l) => acc + l.quantity, 0) + lot.quantity;
        return {
          ...item,
          lots: [...lots, lot],
          stock: totalQuantity
        };
      }
      return item;
    });

    setCurrentCatalog({ ...currentCatalog, items: updatedItems });
    setNewLot({});
  };

  const handleDeleteAttribute = (attrId: string) => {
    setCurrentCatalog({
      ...currentCatalog,
      attributes: (currentCatalog.attributes || []).filter(a => a.id !== attrId)
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setCurrentCatalog({
      ...currentCatalog,
      items: (currentCatalog.items || []).filter(i => i.id !== itemId)
    });
    if (selectedItemId === itemId) setSelectedItemId(null);
  };

  const handleDeleteLot = (lotId: string) => {
    const items = currentCatalog.items || [];
    const updatedItems = items.map(item => {
      if (item.id === selectedItemId && item.lots) {
        const deletedLot = item.lots.find(l => l.id === lotId);
        const newStock = item.stock - (deletedLot?.quantity || 0);
        return {
          ...item,
          lots: item.lots.filter(l => l.id !== lotId),
          stock: newStock
        };
      }
      return item;
    });
    setCurrentCatalog({ ...currentCatalog, items: updatedItems });
  };

  const toggleItemExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleSave = () => {
    onSave(currentCatalog);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Catalog Structure - ${currentCatalog.name || 'New Catalog'}`}>
      <div className="max-h-[85vh] overflow-y-auto space-y-6">
        {/* Catalog Header Info */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white">Catalog Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Catalog Name"
              value={currentCatalog.name || ''}
              onChange={e => setCurrentCatalog({ ...currentCatalog, name: e.target.value })}
            />
            <Input
              label="Brand"
              value={currentCatalog.brand || ''}
              onChange={e => setCurrentCatalog({ ...currentCatalog, brand: e.target.value })}
            />
            <Select
              label="Category"
              options={['Electronics', 'Apparel', 'Home', 'Beauty', 'Sports', 'Food'].map(c => ({ value: c, label: c }))}
              value={currentCatalog.category}
              onChange={e => setCurrentCatalog({ ...currentCatalog, category: e.target.value })}
            />
          </div>
        </div>

        {/* Stats */}
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

        {/* Sections Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {['catalog', 'attributes', 'items'].map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section as any)}
              className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${
                activeSection === section
                  ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {section === 'catalog' && 'Catalog'}
              {section === 'attributes' && 'Attributes'}
              {section === 'items' && 'Items & Lots'}
            </button>
          ))}
        </div>

        {/* Attributes Section */}
        {activeSection === 'attributes' && (
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Product Attributes</h3>

            {/* Add Attribute */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
              <Input
                label="Attribute Name"
                placeholder="e.g., Color, Size, Material"
                value={newAttribute.name || ''}
                onChange={e => setNewAttribute({ ...newAttribute, name: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-white">Values</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter value (Red, Blue, etc.)"
                    value={attributeValueInput}
                    onChange={e => setAttributeValueInput(e.target.value)}
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddAttributeValue}>
                    Add
                  </Button>
                </div>
                {newAttribute.values && newAttribute.values.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newAttribute.values.map((val, idx) => (
                      <Badge key={idx} variant="secondary">
                        {val}
                        <button
                          onClick={() => handleRemoveAttributeValue(idx)}
                          className="ml-2 hover:text-rose-600 font-bold"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleAddAttribute}>Create Attribute</Button>
            </div>

            {/* Attributes List */}
            {currentCatalog.attributes && currentCatalog.attributes.length > 0 && (
              <div className="space-y-2">
                {currentCatalog.attributes.map(attr => (
                  <div key={attr.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{attr.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {attr.values.map((val, idx) => (
                          <Badge key={idx} variant="primary">{val}</Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAttribute(attr.id)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items & Lots Section */}
        {activeSection === 'items' && (
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Items & Lots</h3>
              <Button onClick={() => setActiveSection('items')} size="sm" icon={<Plus size={14} />}>
                Add Item
              </Button>
            </div>

            {/* Add Item Form */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">New Item</h4>
              <Input
                label="Item Name"
                placeholder="e.g., Product Name"
                value={newItem.name || ''}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              />
              <Input
                label="SKU"
                placeholder="Unique SKU"
                value={newItem.sku || ''}
                onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cost Price"
                  type="number"
                  value={newItem.costPrice?.toString() || ''}
                  onChange={e => setNewItem({ ...newItem, costPrice: Number(e.target.value) })}
                />
                <Input
                  label="Sale Price"
                  type="number"
                  value={newItem.price?.toString() || ''}
                  onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                />
              </div>
              <Input
                label="Location"
                placeholder="e.g., Shelf A1"
                value={newItem.location || ''}
                onChange={e => setNewItem({ ...newItem, location: e.target.value })}
              />
              <Button onClick={handleAddItem}>Create Item</Button>
            </div>

            {/* Items List */}
            {currentCatalog.items && currentCatalog.items.length > 0 && (
              <div className="space-y-2">
                {currentCatalog.items.map(item => (
                  <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div
                      onClick={() => toggleItemExpanded(item.id)}
                      className={`p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center ${
                        selectedItemId === item.id ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button className="p-0">
                          {expandedItems.has(item.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{item.sku} • {item.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Stock</p>
                          <p className="font-bold text-slate-900 dark:text-white">{item.stock}</p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedItemId(item.id);
                          }}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Lots */}
                    {expandedItems.has(item.id) && (
                      <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Lots & Batches</h5>

                        {/* Add Lot */}
                        {selectedItemId === item.id && (
                          <div className="bg-white dark:bg-slate-700 p-3 rounded border border-slate-200 dark:border-slate-600 space-y-2">
                            <Input
                              label="Lot Number"
                              placeholder="e.g., ABC-001"
                              value={newLot.lotNumber || ''}
                              onChange={e => setNewLot({ ...newLot, lotNumber: e.target.value })}
                              className="text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                label="Quantity"
                                type="number"
                                value={newLot.quantity?.toString() || ''}
                                onChange={e => setNewLot({ ...newLot, quantity: Number(e.target.value) })}
                                className="text-sm"
                              />
                              <Input
                                label="Cost"
                                type="number"
                                value={newLot.costPrice?.toString() || ''}
                                onChange={e => setNewLot({ ...newLot, costPrice: Number(e.target.value) })}
                                className="text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                label="Mfg Date"
                                type="date"
                                value={newLot.manufacturingDate || ''}
                                onChange={e => setNewLot({ ...newLot, manufacturingDate: e.target.value })}
                                className="text-sm"
                              />
                              <Input
                                label="Exp Date"
                                type="date"
                                value={newLot.expiryDate || ''}
                                onChange={e => setNewLot({ ...newLot, expiryDate: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                            <Button size="sm" onClick={handleAddLot}>Add Lot</Button>
                          </div>
                        )}

                        {/* Lots Table */}
                        {item.lots && item.lots.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-600">
                                  <th className="text-left py-1 px-2 font-bold">Lot #</th>
                                  <th className="text-right py-1 px-2 font-bold">Qty</th>
                                  <th className="text-right py-1 px-2 font-bold">Cost</th>
                                  <th className="text-center py-1 px-2 font-bold">Exp</th>
                                  <th className="text-right py-1 px-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.lots.map(lot => (
                                  <tr key={lot.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700">
                                    <td className="py-1 px-2 font-mono font-bold">{lot.lotNumber}</td>
                                    <td className="py-1 px-2 text-right font-bold">{lot.quantity}</td>
                                    <td className="py-1 px-2 text-right text-xs">{settings.currencySymbol}{lot.costPrice}</td>
                                    <td className="py-1 px-2 text-center text-xs">
                                      {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="py-1 px-2 text-right">
                                      <button
                                        onClick={() => handleDeleteLot(lot.id)}
                                        className="text-rose-600 hover:text-rose-700"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-2">No lots. Click + to add.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Catalog</Button>
      </div>
    </Modal>
  );
};
