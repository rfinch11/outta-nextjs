'use client';

import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { LuX, LuUpload } from 'react-icons/lu';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SubmitActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  email: string;
  title: string;
  description: string;
  address: string;
  parentTips: string;
  startDate: string;
  startTime: string;
  websiteUrl: string;
  image: File | null;
}

interface FormErrors {
  email?: string;
  title?: string;
}

const SubmitActivityDrawer: React.FC<SubmitActivityDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    title: '',
    description: '',
    address: '',
    parentTips: '',
    startDate: '',
    startTime: '',
    websiteUrl: '',
    image: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.title) {
      newErrors.title = 'Activity title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          title: formData.title,
          description: formData.description,
          address: formData.address,
          parentTips: formData.parentTips,
          startDate: formData.startDate,
          startTime: formData.startTime,
          websiteUrl: formData.websiteUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitSuccess(true);

      // Reset form after showing success message
      setTimeout(() => {
        setFormData({
          email: '',
          title: '',
          description: '',
          address: '',
          parentTips: '',
          startDate: '',
          startTime: '',
          websiteUrl: '',
          image: null,
        });
        setImagePreview(null);
        setSubmitSuccess(false);
        onOpenChange(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = "w-full px-4 py-3 text-base border border-black-200 rounded-lg outline-none focus:border-malibu-950 focus:ring-1 focus:ring-malibu-950";
  const labelClassName = "block text-sm font-medium text-malibu-950 mb-2";

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content
          className={
            isLargeScreen
              ? 'bg-white flex flex-col rounded-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] outline-none overflow-hidden w-full max-w-md shadow-xl max-h-[90vh]'
              : 'bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[70] outline-none overflow-hidden max-h-[90vh]'
          }
        >
          <Drawer.Title className="sr-only">Submit an Activity</Drawer.Title>
          <Drawer.Description className="sr-only">
            Submit a new activity to be listed on Outta
          </Drawer.Description>

          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-black-100">
            <h2 className="text-xl font-bold text-malibu-950">Submit an Activity</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center transition-colors hover:opacity-70"
              aria-label="Close"
              type="button"
            >
              <LuX size={24} className="text-malibu-950" />
            </button>
          </div>

          {/* Form Content */}
          <div className="px-5 py-4 overflow-y-auto flex-1">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-malibu-950 mb-2">Thank you!</h3>
                <p className="text-black-500">Your activity has been submitted for review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClassName}>
                    Your email <span className="text-flamenco-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${inputClassName} ${errors.email ? 'border-flamenco-500' : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-flamenco-500 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Activity Title */}
                <div>
                  <label htmlFor="title" className={labelClassName}>
                    Activity title <span className="text-flamenco-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`${inputClassName} ${errors.title ? 'border-flamenco-500' : ''}`}
                    placeholder="e.g., Kids Art Workshop"
                  />
                  {errors.title && (
                    <p className="text-sm text-flamenco-500 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className={labelClassName}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`${inputClassName} min-h-[100px] resize-none`}
                    placeholder="Tell us about the activity..."
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className={labelClassName}>
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={inputClassName}
                    placeholder="e.g., 123 Main St, San Francisco, CA 94102"
                  />
                </div>

                {/* Parent Tips */}
                <div>
                  <label htmlFor="parentTips" className={labelClassName}>
                    Parent tips
                  </label>
                  <textarea
                    id="parentTips"
                    name="parentTips"
                    value={formData.parentTips}
                    onChange={handleInputChange}
                    className={`${inputClassName} min-h-[80px] resize-none`}
                    placeholder="Any tips for parents? e.g., bring snacks, parking info..."
                  />
                </div>

                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="startDate" className={labelClassName}>
                      Start date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="startTime" className={labelClassName}>
                      Start time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* Website URL */}
                <div>
                  <label htmlFor="websiteUrl" className={labelClassName}>
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    className={inputClassName}
                    placeholder="https://..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className={labelClassName}>Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-black-300 rounded-lg cursor-pointer hover:border-malibu-950 transition-colors"
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <LuUpload size={20} className="text-black-400" />
                          <span className="text-black-500">Upload an image</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold transition-colors hover:bg-malibu-900 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Activity'}
                </button>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SubmitActivityDrawer;
