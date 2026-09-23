import React, { useState } from 'react';
import { Person, Relationship } from '../types/network';
import { INDUSTRIES, AVATAR_COLORS } from '../data/mockNetwork';
import { X, Plus, Upload, Download, Check, UserPlus } from 'lucide-react';

interface CustomProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNodes: Person[];
  onSaveCustomProfile: (profile: Person, connectionIds: string[]) => void;
  onImportData: (data: { nodes: Person[]; relationships: Relationship[] }) => void;
  allNodes: Person[];
  allEdges: Relationship[];
}

export const CustomProfileModal: React.FC<CustomProfileModalProps> = ({
  isOpen,
  onClose,
  existingNodes,
  onSaveCustomProfile,
  onImportData,
  allNodes,
  allEdges,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [location, setLocation] = useState('台北');
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [openTo, setOpenTo] = useState('');
  const [selectedConnections, setSelectedConnections] = useState<string[]>(['p16', 'p1']);
  const [searchFriend, setSearchFriend] = useState('');

  const filteredPotentialFriends = existingNodes.filter(n =>
    n.name.includes(searchFriend) ||
    n.company.includes(searchFriend) ||
    n.role.includes(searchFriend)
  ).slice(0, 10);

  const toggleConnection = (id: string) => {
    if (selectedConnections.includes(id)) {
      setSelectedConnections(selectedConnections.filter(c => c !== id));
    } else {
      if (selectedConnections.length >= 5) {
        return; // Max 5 direct initial anchors
      }
      setSelectedConnections([...selectedConnections, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !company.trim()) {
      alert('請填寫姓名、職銜與所屬機構');
      return;
    }

    const skills = skillsStr
      .split(/[,，、]/)
      .map(s => s.trim())
      .filter(Boolean);

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const customProfile: Person = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      englishName: englishName.trim() || undefined,
      role: role.trim(),
      company: company.trim(),
      industry,
      location: location.trim(),
      bio: bio.trim() || '專注於自身專業領域之實踐與拓展，樂於結識志同道合之夥伴。',
      skills: skills.length > 0 ? skills : ['策略合作', '商業拓展', '跨界交流'],
      interests: ['創新思維', '產業交流'],
      openTo: openTo.trim() || '開放尋找商業合作、產業顧問與技術引薦',
      avatarColor: randomColor,
      isCustom: true,
    };

    onSaveCustomProfile(customProfile, selectedConnections);
    onClose();
  };

  // Export current graph as JSON
  const handleExportJSON = () => {
    const data = {
      nodes: allNodes,
      relationships: allEdges,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusnet-graph-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.nodes && json.relationships) {
          onImportData({
            nodes: json.nodes,
            relationships: json.relationships,
          });
          alert(`成功匯入 ${json.nodes.length} 位成員與 ${json.relationships.length} 條關係！`);
          onClose();
        } else {
          alert('JSON 格式不符合預期（缺少 nodes 或 relationships）');
        }
      } catch (err) {
        alert('解析 JSON 檔案失敗，請檢查格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                建立我的真實身分資料
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                填寫個人檔案並選取 1~3 位已知好友，系統將你無縫嵌入人脈圖譜
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                姓名 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：王小明"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                英文名 (選填)
              </label>
              <input
                type="text"
                value={englishName}
                onChange={e => setEnglishName(e.target.value)}
                placeholder="例如：Alex Wang"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                職銜 (Role) *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="例如：創辦人 / 軟體工程師 / 產品總監"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                所屬機構 / 公司 *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="例如：某科技新創 / 自雇顧問"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                所屬產業領域
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                所在地點
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="例如：台北、新竹、矽谷"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              個人簡介 / 目前核心目標
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="簡要描述你的專業經歷、正在推進的專案，以及希望透過人脈網達成的目標..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                專業標籤 (以逗號分隔)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={e => setSkillsStr(e.target.value)}
                placeholder="AI, B2B SaaS, 醫療採購, 募資"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                目前開放尋找的合作 (Open to)
              </label>
              <input
                type="text"
                value={openTo}
                onChange={e => setOpenTo(e.target.value)}
                placeholder="例如：尋找種子輪投資人、尋求企業客戶"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Connect to Existing Network Nodes */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-slate-200 block mb-1">
              建立初始人脈錨點（選取你在人脈網中認識的 1~3 位好友）：
            </span>
            <p className="text-[11px] text-slate-400 mb-2">
              系統將為你建立與這些成員的 1 度直接連結，其餘 90+ 位成員即可自然延伸為你的 2 度與 3 度人脈。
            </p>

            <input
              type="text"
              value={searchFriend}
              onChange={e => setSearchFriend(e.target.value)}
              placeholder="搜尋想建立連結的好友姓名或機構..."
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 mb-2 outline-none"
            />

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {filteredPotentialFriends.map(friend => {
                const isSelected = selectedConnections.includes(friend.id);
                return (
                  <button
                    type="button"
                    key={friend.id}
                    onClick={() => toggleConnection(friend.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{friend.name} ({friend.company})</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Import / Export Utility */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">數據備份與匯入：</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs cursor-pointer transition-colors">
                <Upload className="w-3 h-3" />
                <span>匯入 JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>匯出圖譜 JSON</span>
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              儲存並以此身分進入人脈網
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
