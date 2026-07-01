'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Trash2, ChevronUp, ChevronDown, X, AlertTriangle } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import PhotoUpload from '@/components/PhotoUpload';

interface Photo {
  id: string;
  storage_url: string;
  display_order: number;
  is_primary: boolean;
}

function DeleteConfirmModal({
  photo,
  onConfirm,
  onCancel,
  loading,
}: {
  photo: Photo;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Delete this photo?</h3>
        <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The photo will be permanently removed.</p>
        <div className="aspect-[3/4] w-24 mx-auto mb-6 rounded-xl overflow-hidden">
          <img src={photo.storage_url} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Deleting...' : 'Delete Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PhotoManagementPage() {
  const { user, db, refreshUser } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Photo | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchPhotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchPhotos() {
    const { data } = await db
      .from('photos')
      .select('id, storage_url, display_order, is_primary')
      .eq('user_id', user!.id)
      .order('display_order', { ascending: true });
    setPhotos((data as Photo[]) || []);
    setLoading(false);
  }

  async function handleUploadComplete(url: string) {
    if (photos.length >= 6) return;
    const nextOrder = photos.length + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('photos') as any).insert({
      user_id: user!.id,
      storage_url: url,
      display_order: nextOrder,
      is_primary: photos.length === 0,
    });
    await fetchPhotos();
    await refreshUser();
  }

  async function handleSetPrimary(photoId: string) {
    if (!user) return;
    setPromoting(photoId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('photos') as any).update({ is_primary: false }).eq('user_id', user.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('photos') as any).update({ is_primary: true, display_order: 1 }).eq('id', photoId);
    const others = photos.filter(p => p.id !== photoId);
    await Promise.all(
      others.map((p, i) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db.from('photos') as any).update({ display_order: i + 2 }).eq('id', p.id)
      )
    );
    await fetchPhotos();
    setPromoting(null);
  }

  async function handleMove(photo: Photo, direction: 'up' | 'down') {
    const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(p => p.id === photo.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    setReordering(photo.id);
    const swapPhoto = sorted[swapIdx];
    const newOrder = photo.display_order;
    const swapOrder = swapPhoto.display_order;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('photos') as any).update({ display_order: swapOrder }).eq('id', photo.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('photos') as any).update({ display_order: newOrder }).eq('id', swapPhoto.id);

    // Keep primary in sync: photo with order 1 becomes primary
    const newFirst = direction === 'up' && swapIdx === 0 ? photo : direction === 'down' && idx === 0 ? swapPhoto : null;
    if (newFirst) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from('photos') as any).update({ is_primary: false }).eq('user_id', user!.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from('photos') as any).update({ is_primary: true }).eq('id', newFirst.id);
    }

    await fetchPhotos();
    setReordering(null);
  }

  async function confirmDeletePhoto() {
    if (!confirmDelete || !user) return;
    setDeleting(true);
    const photo = confirmDelete;
    const urlParts = photo.storage_url.split('/');
    const filename = urlParts.slice(-2).join('/');
    await db.storage.from('profile-photos').remove([filename]);
    await db.from('photos').delete().eq('id', photo.id);
    if (photo.is_primary) {
      const remaining = photos.filter(p => p.id !== photo.id);
      if (remaining.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.from('photos') as any).update({ is_primary: true, display_order: 1 }).eq('id', remaining[0].id);
      }
    }
    await fetchPhotos();
    await refreshUser();
    setDeleting(false);
    setConfirmDelete(null);
  }

  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
  const atMax = photos.length >= 6;

  return (
    <AuthGuard>
      {confirmDelete && (
        <DeleteConfirmModal
          photo={confirmDelete}
          onConfirm={confirmDeletePhoto}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-display font-bold text-gray-900">Manage Photos</h1>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Upload New Photo</h3>
            <span className={`text-sm font-semibold ${atMax ? 'text-red-500' : 'text-gray-400'}`}>
              {photos.length}/6 photos
            </span>
          </div>
          {atMax ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-amber-700 text-sm font-semibold">6-photo limit reached</p>
              <p className="text-amber-600 text-xs mt-1">Delete a photo below to upload a new one.</p>
            </div>
          ) : (
            <PhotoUpload onUploadComplete={handleUploadComplete} />
          )}
        </div>

        {/* Photo grid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Your Photos</h3>
            <span className="text-xs text-gray-400">Drag or use arrows to reorder</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No photos yet. Upload your first photo above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {sorted.map((photo, idx) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden">
                    <img
                      src={`${photo.storage_url}?auto=compress&cs=tinysrgb&w=400`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {photo.is_primary && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="flex items-center gap-0.5 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Primary
                      </span>
                    </div>
                  )}

                  {/* Reorder arrows */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMove(photo, 'up')}
                      disabled={idx === 0 || reordering === photo.id}
                      className="w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow-sm disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleMove(photo, 'down')}
                      disabled={idx === sorted.length - 1 || reordering === photo.id}
                      className="w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow-sm disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl p-2 flex flex-col gap-1.5">
                    {!photo.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(photo.id)}
                        disabled={promoting === photo.id}
                        className="w-full py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        {promoting === photo.id ? '...' : 'Set Primary'}
                      </button>
                    )}
                    {sorted.length > 1 && (
                      <button
                        onClick={() => setConfirmDelete(photo)}
                        className="w-full py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Hover over a photo to reorder, set primary, or delete. Your primary photo appears first in browse.
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
