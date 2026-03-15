
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Post } from "@/types";
import { X, Paperclip, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Design tokens ──────────────────────────────────────────────
const BG       = "#15181D";
const BORDER   = "rgba(187,187,187,0.3)";
const GREEN    = "#388E3C";
const FONT_RL  = "'Raleway', sans-serif";

// ── Schema ─────────────────────────────────────────────────────
const getFormSchema = (_isEditMode: boolean) =>
  z.object({
    text:       z.string().min(1, "Text can't be empty.").max(500),
    imageFiles: z.any().optional(),
    category:   z.enum(["General", "Event", "For Sale", "Business"]).default("General"),
  });

// ── GIF icon (SVG) ─────────────────────────────────────────────
const GifIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="20" height="20" rx="3" stroke={GREEN} strokeWidth="1.3" />
    <text
      x="11" y="15"
      textAnchor="middle"
      fontFamily="Rajdhani, sans-serif"
      fontWeight="600"
      fontSize="10"
      fill={GREEN}
    >GIF</text>
  </svg>
);

// ── Location pin icon (SVG matching Figma) ─────────────────────
const LocationIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11 2C7.686 2 5 4.686 5 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6zm0 8.5A2.5 2.5 0 1 1 11 5.5a2.5 2.5 0 0 1 0 5z"
      stroke={GREEN}
      strokeWidth="1.3"
      fill="none"
    />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────
type CreatePostDialogProps = {
  children?:     React.ReactNode;
  postToEdit?:   Post;
  onOpenChange?: (open: boolean) => void;
  createPost:    (postData: any, postId?: string, imageFiles?: FileList) => Promise<void>;
  open?:         boolean;
};

// ── Inner form content (shared between Dialog and Sheet) ───────
function PostForm({
  form,
  loading,
  onSubmit,
  onClose,
  isEditMode,
  fileInputRef,
}: {
  form: any;
  loading: boolean;
  onSubmit: (v: any) => void;
  onClose: () => void;
  isEditMode: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const text = form.watch("text") as string;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* ── Top close button ── */}
      <div className="flex items-center justify-end px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* ── Textarea ── */}
      <div className="flex-1 px-5 pb-2">
        <textarea
          {...form.register("text")}
          placeholder="What's going on?"
          rows={4}
          className={cn(
            "w-full bg-transparent resize-none outline-none border-none",
            "text-white placeholder:text-white/90 text-[14px] leading-[16px]",
          )}
          style={{ fontFamily: FONT_RL, fontWeight: 400 }}
          autoFocus
        />
        {form.formState.errors.text && (
          <p className="text-red-400 text-xs mt-1">
            {form.formState.errors.text.message as string}
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-5" style={{ borderTop: "0.2px solid #FFFFFF" }} />

      {/* ── Bottom toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left icons */}
        <div className="flex items-center gap-4">
          {/* Paperclip / attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hover:opacity-70 transition-opacity"
            aria-label="Attach image"
          >
            <Paperclip size={22} color={GREEN} strokeWidth={2} />
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => form.setValue("imageFiles", e.target.files)}
          />

          {/* GIF */}
          <button
            type="button"
            className="hover:opacity-70 transition-opacity"
            aria-label="Add GIF"
          >
            <GifIcon />
          </button>

          {/* Location */}
          <button
            type="button"
            className="hover:opacity-70 transition-opacity"
            aria-label="Add location"
          >
            <LocationIcon />
          </button>
        </div>

        {/* Post button */}
        <button
          type="submit"
          disabled={loading || !text?.trim()}
          className="h-[37px] px-8 rounded-full text-white text-[14px] font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ background: GREEN, fontFamily: FONT_RL }}
        >
          {loading
            ? isEditMode ? "Saving…" : "Posting…"
            : isEditMode ? "Save" : "Post"}
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────
const CreatePostDialogComponent = ({
  children,
  postToEdit,
  onOpenChange,
  createPost,
  open: externalOpen,
}: CreatePostDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading]           = useState(false);
  const isMobile    = useIsMobile();
  const isEditMode  = !!postToEdit;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  const formSchema = useMemo(() => getFormSchema(isEditMode), [isEditMode]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "", imageFiles: undefined, category: "General" as const },
  });

  const stableReset = useCallback((v: any) => form.reset(v), [form]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (isEditMode && postToEdit) {
        stableReset({ text: postToEdit.text, imageFiles: undefined, category: postToEdit.category || "General" });
      } else {
        stableReset({ text: "", imageFiles: undefined, category: "General" });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [open, isEditMode, postToEdit, stableReset]);

  const handleOpenChange = useCallback((next: boolean) => {
    if (externalOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) form.reset();
  }, [onOpenChange, externalOpen, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const imageFiles = values.imageFiles?.length > 0 ? values.imageFiles : undefined;
    const postData   = { ...values, image_urls: isEditMode && postToEdit?.image_urls ? postToEdit.image_urls : undefined };
    await createPost(postData, postToEdit?.id, imageFiles);
    setLoading(false);
    handleOpenChange(false);
  }

  // Shared dialog inner styling
  const dialogStyles: React.CSSProperties = {
    background:   BG,
    border:       `0.2px solid ${BORDER}`,
    borderRadius: "11px",
    padding:      0,
    overflow:     "hidden",
    maxWidth:     "626px",
    width:        "100%",
  };

  const formProps = { form, loading, onSubmit, onClose: () => handleOpenChange(false), isEditMode, fileInputRef };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{children ?? <span />}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="p-0"
          style={{ background: BG, border: `0.2px solid ${BORDER}`, borderTopLeftRadius: "11px", borderTopRightRadius: "11px", minHeight: "260px" }}
        >
          <PostForm {...formProps} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>{children ?? <span />}</DialogTrigger>
      )}
      <DialogContent
        style={dialogStyles}
        className="[&>button]:hidden" // hide default X added by DialogContent
      >
        <PostForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
};

export const CreatePostDialog = memo(CreatePostDialogComponent);
