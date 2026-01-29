import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X, Music, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardNewProduct() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'single',
    description: '',
    price: '',
    track_names: []
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: artist } = useQuery({
    queryKey: ['my-artist', user?.email],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ owner_email: user.email });
      return artists[0] || null;
    },
    enabled: !!user?.email
  });

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAudioChange = (e) => {
    const files = Array.from(e.target.files);
    const newTracks = files.map(file => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, '')
    }));
    setAudioFiles(prev => [...prev, ...newTracks]);
    setFormData(prev => ({
      ...prev,
      track_names: [...prev.track_names, ...newTracks.map(t => t.name)]
    }));
  };

  const removeTrack = (index) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      track_names: prev.track_names.filter((_, i) => i !== index)
    }));
  };

  const updateTrackName = (index, name) => {
    setFormData(prev => ({
      ...prev,
      track_names: prev.track_names.map((t, i) => i === index ? name : t)
    }));
  };

  const handleSubmit = async (publish = false) => {
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!coverFile) {
      toast.error('Please upload cover art');
      return;
    }
    if (audioFiles.length === 0) {
      toast.error('Please upload at least one audio file');
      return;
    }

    setUploading(true);

    // Upload cover
    let coverUrl = '';
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: coverFile });
      coverUrl = file_url;
    } catch (e) {
      toast.error('Failed to upload cover art');
      setUploading(false);
      return;
    }

    // Upload audio files
    const audioUrls = [];
    for (const track of audioFiles) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: track.file });
        audioUrls.push(file_url);
      } catch (e) {
        toast.error(`Failed to upload ${track.name}`);
        setUploading(false);
        return;
      }
    }

    // Create product
    const product = await base44.entities.Product.create({
      artist_id: artist.id,
      artist_name: artist.name,
      artist_slug: artist.slug,
      title: formData.title,
      type: formData.type,
      description: formData.description,
      price_cents: Math.round(parseFloat(formData.price) * 100),
      currency: 'USD',
      cover_url: coverUrl,
      audio_urls: audioUrls,
      track_names: formData.track_names,
      status: publish ? 'live' : 'draft'
    });

    setUploading(false);
    toast.success(publish ? 'Product published!' : 'Draft saved');
    navigate(createPageUrl('DashboardProducts'));
  };

  if (!artist) {
    return (
      <DashboardLayout currentPage="DashboardProducts">
        <div className="text-center py-16">
          <p className="text-neutral-500 mb-4">Create your artist profile first</p>
          <Link to={createPageUrl('DashboardSettings')}>
            <Button>Set Up Profile</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="DashboardProducts" artist={artist}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl('DashboardProducts')}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold">New Release</h1>
          <p className="text-neutral-600">Upload your music and set your price</p>
        </div>

        <div className="space-y-6">
          {/* Cover Art */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Art</CardTitle>
              <CardDescription>Square image, at least 1400x1400 pixels recommended</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="w-40 h-40 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Cover
                      </span>
                    </Button>
                  </label>
                  {coverFile && (
                    <p className="text-sm text-neutral-500 mt-2">{coverFile.name}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Album or single name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell fans about this release..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="max-w-[200px]">
                <Label htmlFor="price">Price (USD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="9.99"
                    className="pl-7"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Files */}
          <Card>
            <CardHeader>
              <CardTitle>Audio Files</CardTitle>
              <CardDescription>Upload MP3 or WAV files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audioFiles.map((track, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                    <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <Input
                      value={formData.track_names[index] || ''}
                      onChange={(e) => updateTrackName(index, e.target.value)}
                      placeholder="Track name"
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeTrack(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleAudioChange}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tracks
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => navigate(createPageUrl('DashboardProducts'))}>
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSubmit(false)}
                disabled={uploading}
              >
                Save Draft
              </Button>
              <Button 
                className="bg-black text-white hover:bg-neutral-800"
                onClick={() => handleSubmit(true)}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Publish'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}