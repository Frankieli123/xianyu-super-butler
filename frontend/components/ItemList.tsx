import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Item, AccountDetail } from '../types';
import { getItems, getAccountDetails, syncItemsFromAccount, createItem, updateItem, deleteItem } from '../services/api';
import { Box, RefreshCw, ShoppingBag, Edit, Trash2, Plus, Save, X } from 'lucide-react';

const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});
  const [addForm, setAddForm] = useState({
    cookie_id: '',
    item_id: '',
    item_title: '',
    item_price: '',
    item_image: '',
    is_multi_spec: false,
    multi_quantity_delivery: false
  });

  useEffect(() => {
    getAccountDetails().then(setAccounts);
    getItems().then(setItems);
  }, []);

  const handleSync = async () => {
      if (!selectedAccount) return alert('请先选择账号');
      setLoading(true);
      await syncItemsFromAccount(selectedAccount);
      getItems().then(setItems);
      setLoading(false);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setEditForm({ ...item, multi_quantity_delivery: (item as any).multi_quantity_delivery });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      await updateItem(selectedItem.cookie_id, selectedItem.item_id, {
        item_title: editForm.item_title,
        item_price: editForm.item_price,
        item_image: editForm.item_image,
        is_multi_spec: editForm.is_multi_spec,
        multi_quantity_delivery: (editForm as any).multi_quantity_delivery
      });
      const updatedItems = items.map(item =>
        item.cookie_id === selectedItem.cookie_id && item.item_id === selectedItem.item_id
          ? { ...item, ...editForm }
          : item
      );
      setItems(updatedItems);
      setShowEditModal(false);
    } catch (error) {
      console.error('更新商品失败:', error);
      alert('更新失败，请重试');
    }
  };

  const handleDelete = async (item: Item) => {
    if (confirm(`确认删除商品"${item.item_title}"吗？`)) {
      try {
        await deleteItem(item.cookie_id, item.item_id);
        const filteredItems = items.filter(i =>
          !(i.cookie_id === item.cookie_id && i.item_id === item.item_id)
        );
        setItems(filteredItems);
      } catch (error) {
        console.error('删除商品失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleAddItem = async () => {
    try {
      if (!addForm.cookie_id || !addForm.item_id) {
        return alert('请填写账号和商品ID');
      }
      await createItem(addForm.cookie_id, addForm);
      getItems().then(setItems);
      setShowAddModal(false);
      setAddForm({
        cookie_id: '',
        item_id: '',
        item_title: '',
        item_price: '',
        item_image: '',
        is_multi_spec: false,
        multi_quantity_delivery: false
      });
    } catch (error) {
      console.error('添加商品失败:', error);
      alert('添加失败，请重试');
    }
  };

  const toggleMultiSpec = async (item: Item) => {
    try {
      const newValue = !item.is_multi_spec;
      await updateItem(item.cookie_id, item.item_id, { is_multi_spec: newValue });
      const updatedItems = items.map(i =>
        i.cookie_id === item.cookie_id && i.item_id === item.item_id
          ? { ...i, is_multi_spec: newValue }
          : i
      );
      setItems(updatedItems);
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  };

  const toggleMultiQty = async (item: any) => {
    try {
      const newValue = !item.multi_quantity_delivery;
      await updateItem(item.cookie_id, item.item_id, { multi_quantity_delivery: newValue });
      const updatedItems = items.map(i =>
        i.cookie_id === item.cookie_id && i.item_id === item.item_id
          ? { ...i, multi_quantity_delivery: newValue }
          : i
      );
      setItems(updatedItems);
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">商品管理</h2>
          <p className="text-gray-500 mt-2 text-sm">监控并管理所有账号下的闲鱼商品。</p>
        </div>
        <div className="flex gap-3">
            <select
                className="ios-input px-4 py-3 rounded-xl text-sm"
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
            >
                <option value="">选择账号以同步</option>
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.nickname}</option>
                ))}
            </select>
            <button
                onClick={handleSync}
                disabled={loading || !selectedAccount}
                className="ios-btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg shadow-yellow-200 disabled:opacity-50"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                同步商品
            </button>
            <button
              onClick={() => { setAddForm(prev => ({ ...prev, cookie_id: prev.cookie_id || selectedAccount })); setShowAddModal(true); }}
              className="px-5 py-3 rounded-2xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              添加商品
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
              <div key={`${item.cookie_id}-${item.item_id}`} className="ios-card p-4 rounded-3xl hover:shadow-lg transition-all group relative">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-[#FFE815] transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-red-100 text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                      {item.item_image ? (
                          <img src={item.item_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Box className="w-10 h-10" />
                          </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                          ¥{item.item_price}
                      </div>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 text-sm mb-2 h-10">{item.item_title}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded-md truncate max-w-[100px]">ID: {item.item_id}</span>
                  </div>
                  <div className="flex gap-2">
                      <button
                        onClick={() => toggleMultiSpec(item)}
                        className={`flex-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                          item.is_multi_spec
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        多规格
                      </button>
                      <button
                        onClick={() => toggleMultiQty(item)}
                        className={`flex-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                          (item as any).multi_quantity_delivery
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        多数量发货
                      </button>
                  </div>
              </div>
          ))}
          {items.length === 0 && (
             <div className="col-span-full py-20 text-center text-gray-400">
                 <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                 暂无商品数据，请选择账号进行同步
             </div>
          )}
      </div>

      {/* Add Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay-centered">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-2xl font-extrabold text-gray-900">添加商品</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">所属账号</label>
                  <select
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={addForm.cookie_id}
                    onChange={e => setAddForm({ ...addForm, cookie_id: e.target.value })}
                  >
                    <option value="">选择账号</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.nickname}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品ID</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={addForm.item_id}
                    onChange={e => setAddForm({ ...addForm, item_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品标题</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={addForm.item_title}
                    onChange={e => setAddForm({ ...addForm, item_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品价格</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={addForm.item_price}
                    onChange={e => setAddForm({ ...addForm, item_price: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品图片URL</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={addForm.item_image}
                    onChange={e => setAddForm({ ...addForm, item_image: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addForm.is_multi_spec}
                    onChange={e => setAddForm({ ...addForm, is_multi_spec: e.target.checked })}
                    id="add-multi-spec"
                  />
                  <label htmlFor="add-multi-spec" className="text-sm font-bold text-gray-700">多规格商品</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addForm.multi_quantity_delivery}
                    onChange={e => setAddForm({ ...addForm, multi_quantity_delivery: e.target.checked })}
                    id="add-multi-qty"
                  />
                  <label htmlFor="add-multi-qty" className="text-sm font-bold text-gray-700">多数量发货</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-colors">取消</button>
                <button onClick={handleAddItem} className="flex-1 ios-btn-primary px-6 py-3 rounded-xl font-bold">添加</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && createPortal(
        <div className="modal-overlay-centered">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-2xl font-extrabold text-gray-900">编辑商品</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品标题</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={editForm.item_title || ''}
                    onChange={e => setEditForm({ ...editForm, item_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品价格</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={editForm.item_price || ''}
                    onChange={e => setEditForm({ ...editForm, item_price: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品图片URL</label>
                  <input
                    type="text"
                    className="w-full ios-input px-4 py-3 rounded-xl"
                    value={editForm.item_image || ''}
                    onChange={e => setEditForm({ ...editForm, item_image: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editForm.is_multi_spec}
                    onChange={e => setEditForm({ ...editForm, is_multi_spec: e.target.checked })}
                    id="edit-multi-spec"
                  />
                  <label htmlFor="edit-multi-spec" className="text-sm font-bold text-gray-700">多规格商品</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!(editForm as any).multi_quantity_delivery}
                    onChange={e => setEditForm({ ...editForm, multi_quantity_delivery: e.target.checked } as any)}
                    id="edit-multi-qty"
                  />
                  <label htmlFor="edit-multi-qty" className="text-sm font-bold text-gray-700">多数量发货</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowEditModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-colors">取消</button>
                <button onClick={handleSaveEdit} className="flex-1 ios-btn-primary px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  保存更改
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ItemList;
