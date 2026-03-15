
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import * as React from "react";
import { usePosts } from "@/hooks/use-posts";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Post } from "@/types";
import Image from "next/image";

/* ─── design tokens ─────────────────────────────────────────────── */
const BG_DARK = "#15181D";
const CARD_BG = "#1E2126";
const GREEN = "#388E3C";
const FONT_RALEWAY = "Raleway, sans-serif";
const FONT_PACIFICO = "Pacifico, cursive";

/* ─── schema ────────────────────────────────────────────────────── */
const getFormSchema = (isEditMode: boolean) =>
  z.object({
    text: z.string().min(1, "Item title can't be empty.").max(100),
    description: z
      .string()
      .min(1, "Item description is required.")
      .max(1000),
    price: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined
          ? undefined
          : Number(val),
      z.number().positive("Price must be positive.").optional()
    ),
    image: z
      .any()
      .refine(
        (files) =>
          files &&
          (files.length > 0 ||
            (Array.isArray(files) && files.some((f) => typeof f === "string"))),
        "An image is required for the item."
      ),
  });

type CreateItemDialogProps = {
  children?: React.ReactNode;
  postToEdit?: Post;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

/* ─── L-shaped pointer bracket ──────────────────────────────────── */
function Pointer() {
  return (
    <div
      className="w-4 h-4 flex-shrink-0"
      style={{
        borderWidth: "0px 0px 1px 1px",
        borderStyle: "solid",
        borderColor: GREEN,
        borderRadius: "0px 6px 6px 6px",
      }}
    />
  );
}

/* ─── styled label ───────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] font-semibold text-white mb-1"
      style={{ fontFamily: FONT_RALEWAY }}
    >
      {children}
    </p>
  );
}

/* ─── gradient handshake icon (top-right) ───────────────────────── */
function HandshakeIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <defs>
        <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#00D078" />
        </linearGradient>
      </defs>
      {/* simplified handshake shape */}
      <path
        d="M6 22l5-5 4 2 5-5h4l5 5 4-2 5 5-9 7-5-3-5 3L6 22z"
        fill="url(#hg)"
      />
      <path
        d="M14 19l3 8M28 19l-3 8"
        stroke="url(#hg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── inner form body shared by Dialog & Sheet ───────────────────── */
interface FormBodyProps {
  form: ReturnType<typeof useForm<any>>;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
  isEditMode: boolean;
  postToEdit?: Post;
  removedImageIndexes: number[];
  setRemovedImageIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  imageField: ReturnType<ReturnType<typeof useForm>["register"]>;
  onClose: () => void;
}

function FormBody({
  form,
  onSubmit,
  loading,
  isEditMode,
  postToEdit,
  removedImageIndexes,
  setRemovedImageIndexes,
  imageField,
  onClose,
}: FormBodyProps) {
  const submitLabel = loading
    ? isEditMode
      ? "Saving…"
      : "Listing Item…"
    : isEditMode
    ? "Save Changes"
    : "List Item";

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden"
      style={{
        background: CARD_BG,
        border: "0.2px solid #BBBBBB",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-2">
        <div>
          <h2
            className="text-[18px] leading-[32px] text-white"
            style={{ fontFamily: FONT_PACIFICO }}
          >
            {isEditMode ? "Edit Item" : "Create Item for Sale"}
          </h2>
          <p
            className="text-[12px] font-light text-white mt-0.5"
            style={{ fontFamily: FONT_RALEWAY }}
          >
            {isEditMode
              ? "Make changes to your item here."
              : "Sell something in your neighborhood"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HandshakeIcon />
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="px-4 sm:px-6 pb-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'min(65vh, 480px)' }}>

            {/* Item Title */}
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Item Title</FieldLabel>
                  <div className="flex items-end gap-1">
                    <Pointer />
                    <FormControl>
                      <input
                        {...field}
                        placeholder="e.g Slightly used armchair"
                        className="flex-1 h-9 bg-[#15181D] text-white text-[12px] italic font-light rounded-full px-4 outline-none placeholder:text-white/60"
                        style={{
                          border: `0.5px solid ${GREEN}`,
                          fontFamily: FONT_RALEWAY,
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs ml-5" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Description</FieldLabel>
                  <div className="flex items-start gap-1">
                    <Pointer />
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Add more details about the item, it's condition, etc"
                        rows={4}
                        className="flex-1 bg-[#15181D] text-white text-[12px] italic font-light px-4 py-2.5 outline-none resize-none placeholder:text-white/60"
                        style={{
                          border: `0.5px solid ${GREEN}`,
                          borderRadius: "12px",
                          fontFamily: FONT_RALEWAY,
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs ml-5" />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Price (Optional)</FieldLabel>
                  <div className="flex items-end gap-1">
                    <Pointer />
                    <FormControl>
                      <div className="flex-1 relative">
                        <span
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] text-white/70"
                          style={{ fontFamily: FONT_RALEWAY }}
                        >
                          ₦
                        </span>
                        <input
                          {...field}
                          type="number"
                          placeholder="Leave blank if free"
                          className="w-full h-9 bg-[#15181D] text-white text-[12px] font-light rounded-full pl-8 pr-4 outline-none placeholder:text-white/60"
                          style={{
                            border: `0.5px solid ${GREEN}`,
                            fontFamily: FONT_RALEWAY,
                          }}
                        />
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs ml-5" />
                </FormItem>
              )}
            />

            {/* Add Images */}
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FieldLabel>Add Images</FieldLabel>
                  <div className="flex items-end gap-1">
                    <Pointer />
                    <FormControl>
                      <input
                        {...imageField}
                        type="file"
                        accept="image/*"
                        multiple
                        className="flex-1 h-9 bg-[#15181D] text-white text-[12px] font-semibold italic px-3 outline-none file:mr-3 file:text-white file:font-semibold file:bg-transparent file:border-0 file:text-[12px] file:cursor-pointer"
                        style={{
                          border: `0.5px solid ${GREEN}`,
                          borderRadius: "5px",
                          fontFamily: FONT_RALEWAY,
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs ml-5" />
                </FormItem>
              )}
            />

            {/* Existing images (edit mode) */}
            {postToEdit?.image_urls && postToEdit.image_urls.length > 0 && (
              <div className="space-y-2 ml-5">
                <p
                  className="text-[11px] text-white/50"
                  style={{ fontFamily: FONT_RALEWAY }}
                >
                  Current images ({postToEdit.image_urls.length}):
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {postToEdit.image_urls.map((url, index) => {
                    const isRemoved = removedImageIndexes.includes(index);
                    return (
                      <div
                        key={index}
                        className={`relative group rounded-lg overflow-hidden ${
                          isRemoved ? "opacity-40" : ""
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          width={80}
                          height={64}
                          className="w-full h-16 object-cover"
                        />
                        {!isRemoved && (
                          <button
                            type="button"
                            onClick={() =>
                              setRemovedImageIndexes((p) => [...p, index])
                            }
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="px-6 pb-6 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full text-white text-[14px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: GREEN,
                fontFamily: FONT_RALEWAY,
              }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
const CreateItemDialogComponent = ({
  children,
  postToEdit,
  onOpenChange,
  open: externalOpen,
}: CreateItemDialogProps) => {
  const { createPost } = usePosts();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removedImageIndexes, setRemovedImageIndexes] = useState<number[]>([]);
  const isMobile = useIsMobile();
  const isEditMode = !!postToEdit;

  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  const formSchema = useMemo(() => getFormSchema(isEditMode), [isEditMode]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      description: "",
      price: "" as any,
      image: undefined,
    },
  });

  const stableFormReset = useCallback(
    (values: any) => form.reset(values),
    [form]
  );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (isEditMode && postToEdit) {
          stableFormReset({
            text: postToEdit.text,
            description: postToEdit.description,
            price: postToEdit.price,
            image: postToEdit.image_urls || [],
          });
        } else if (!isEditMode) {
          stableFormReset({ text: "", description: "", price: "", image: undefined });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, isEditMode, postToEdit, stableFormReset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    let filteredImageUrls: string[] = [];
    if (postToEdit?.image_urls) {
      filteredImageUrls = postToEdit.image_urls.filter(
        (_, i) => !removedImageIndexes.includes(i)
      );
    }
    let validImageFiles: FileList | undefined;
    if (values.image && values.image.length > 0) {
      const validFiles = Array.from(values.image).filter(
        (f) => f && f instanceof File && (f as File).size > 0
      );
      if (validFiles.length > 0) {
        const dt = new DataTransfer();
        validFiles.forEach((f) => dt.items.add(f as File));
        validImageFiles = dt.files;
      }
    }
    const postData: Partial<Post> = {
      text: values.text,
      description: values.description,
      category: "For Sale",
      price: values.price || 0,
      image_urls: filteredImageUrls,
    };
    await createPost(postData, postToEdit?.id, validImageFiles);
    setLoading(false);
    handleOpenChange(false);
  }

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (externalOpen !== undefined) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
        onOpenChange?.(newOpen);
      }
      if (!newOpen) form.reset();
    },
    [onOpenChange, externalOpen, form]
  );

  const imageField = form.register("image");

  const formBodyProps: FormBodyProps = {
    form,
    onSubmit,
    loading,
    isEditMode,
    postToEdit,
    removedImageIndexes,
    setRemovedImageIndexes,
    imageField,
    onClose: () => handleOpenChange(false),
  };

  /* ── Mobile: bottom Sheet ── */
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{children ?? <span />}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="p-4 border-0 rounded-t-2xl"
          style={{ background: BG_DARK }}
        >
          <FormBody {...formBodyProps} />
        </SheetContent>
      </Sheet>
    );
  }

  /* ── Desktop: centered Dialog ── */
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>{children ?? <span />}</DialogTrigger>
      )}
      <DialogContent
        className="p-4 border-0 shadow-2xl max-w-[626px]"
        style={{ background: BG_DARK }}
      >
        <FormBody {...formBodyProps} />
      </DialogContent>
    </Dialog>
  );
};

export const CreateItemDialog = memo(CreateItemDialogComponent);
