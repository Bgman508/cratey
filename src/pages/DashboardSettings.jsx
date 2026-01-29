import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Loader2, User, Image } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    image_url: '',
    cover_url: ''
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

  const { data: artist, isLoading } = useQuery({
    queryKey: ['my-artist', user?.email],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ owner_email: user.email });
      return artists[0] || null;
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (artist) {
      setFormData({
        name: artist.name || '',
        slug: artist.slug || '',
        bio: artist.bio || '',
        image_url: artist.image_url || '',
        cover_url: artist.cover_url || ''
      });
    }
  }, [artist]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      // Show preview
      setFormData(prev => ({
        ...prev,
        image_url: URL.createObjectURL(file)
      }));
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Show preview
      setFormData(prev => ({
        ...prev,
        cover_url: URL.createObjectURL(file)
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Please enter your artist name');
      return;
    }
    if (!formData.slug) {
      toast.error('Please enter a URL slug');
      return;
    }

    // Check slug availability
    if (!artist || artist.slug !== formData.slug) {
      const existing = await base44.entities.Artist.filter({ slug: formData.slug });
      if (existing.length > 0 && existing[0].id !== artist?.id) {
        toast.error('This URL is already taken');
        return;
      }
    }

    setSaving(true);

    let imageUrl = formData.image_url;
    let coverUrl = formData.cover_url;

    // Upload profile image if changed
    if (profileImage) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: profileImage });
        imageUrl = file_url;
      } catch (e) {
        toast.error('Failed to upload profile image');
        setSaving(false);
        return;
      }
    }

    // Upload cover image if changed
    if (coverImage) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: coverImage });
        coverUrl = file_url;
      } catch (e) {
        toast.error('Failed to upload cover image');
        setSaving(false);
        return;
      }
    }

    const data = {
      name: formData.name,
      slug: formData.slug,
      bio: formData.bio,
      image_url: imageUrl,
      cover_url: coverUrl,
      owner_email: user.email
    };

    if (artist) {
      await base44.entities.Artist.update(artist.id, data);
    } else {
      await base44.entities.Artist.create(data);
    }

    queryClient.invalidateQueries(['my-artist']);
    setSaving(false);
    toast.success('Profile saved!');
    
    if (!artist) {
      navigate(createPageUrl('Dashboard'));
    }
  };

  return (
    <DashboardLayout currentPage="DashboardSettings" artist={artist}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            {artist ? 'Artist Settings' : 'Create Your Profile'}
          </h1>
          <p className="text-neutral-600">
            {artist ? 'Update your storefront details' : 'Set up your artist storefront'}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            {/* Profile Image */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Image</CardTitle>
                <CardDescription>Your profile photo shown on your storefront</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-neutral-100 overflow-hidden flex-shrink-0">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label htmlFor="profile-upload">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>Banner image for your storefront (1400x400 recommended)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full h-32 rounded-lg bg-neutral-100 overflow-hidden">
                    {formData.cover_url ? (
                      <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
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
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Artist Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Your artist name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Storefront URL</Label>
                  <div className="flex items-center mt-1">
                    <span className="px-3 py-2 bg-neutral-100 border border-r-0 rounded-l-md text-sm text-neutral-500">
                      cratey.com/
                    </span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="your-name"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    This is your unique storefront URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell fans about yourself..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                className="bg-black text-white hover:bg-neutral-800"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}