"use client";

import { useState } from "react";
import { X, Upload, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentImage: string;
  onUpdate: () => void;
}

export default function SettingsModal({ isOpen, onClose, currentName, currentImage, onUpdate }: SettingsModalProps) {
  const [name, setName] = useState(currentName);
  const [imageUrl, setImageUrl] = useState(currentImage);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: imageUrl }),
      });

      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        alert("Failed to update profile settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-[#0a0a0c] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">Cadet Profile Settings</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              
              {/* Profile Preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-[#121214] border-2 border-[var(--color-gold-500)] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-[var(--color-gold-500)]" />
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Current Avatar</span>
              </div>

              {/* Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[var(--color-gold-500)] font-extrabold uppercase tracking-wider">Cadet Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="bg-[#121214] text-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[var(--color-gold-500)] transition-all"
                  required 
                />
              </div>

              {/* Profile Picture File Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[var(--color-gold-500)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Upload size={14} /> Avatar Image Upload
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="bg-[#121214] text-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[var(--color-gold-500)] transition-all font-mono text-xs cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--color-gold-500)] file:text-obsidian-900 hover:file:bg-[var(--color-gold-400)]"
                />
                <span className="text-[10px] text-gray-500">Upload a local image. It will be securely stored for your profile.</span>
              </div>

              {/* Save Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-400)] text-obsidian-900 font-extrabold text-xs py-4 rounded-2xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center gap-2 mt-2 hover:scale-[1.02]"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Transmitting..." : "Save Profile Settings"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
