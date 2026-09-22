import { FiDownload, FiX } from "react-icons/fi";
import { SectionHeading, StaggerSection, SurveyDetail } from "./Shared";
import { PhotoCapture } from "@/components/survey/PhotoCapture";

interface PhotosSectionProps {
  r: SurveyDetail;
  editData: Partial<SurveyDetail>;
  editing: boolean;
  setEditData: React.Dispatch<React.SetStateAction<Partial<SurveyDetail>>>;
  setPreviewImage: (url: string | null) => void;
  hasPhotos: boolean;
  index: number;
}

export function PhotosSection({ r, editData, editing, setEditData, setPreviewImage, hasPhotos, index }: PhotosSectionProps) {
  if (!hasPhotos && !editing) return null;

  return (
    <StaggerSection index={index}>
      <section className="bg-white rounded-[14px] border border-gray-100 p-6 sm:p-8 print:border-0 print:p-0 print:rounded-none">
        <SectionHeading>Photos</SectionHeading>
        {editing ? (
          <PhotoCapture
            surveyId={r.survey_id}
            photos={editData.site_photo ?? r.site_photo ?? {}}
            onChange={(p) => setEditData((prev) => ({ ...prev, site_photo: p }))}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {(["form", "site", "other"] as const).map((key) => {
              const url = r.site_photo?.[key];
              const label =
                key === "form"
                  ? "Form Photo"
                  : key === "site"
                    ? "Site Photo"
                    : "Additional";
              if (!url) return null;
              return (
                <div key={key} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(url)}
                    className="aspect-[4/3] rounded-[10px] overflow-hidden border border-gray-100 cursor-zoom-in group relative"
                  >
                    <img
                      src={url}
                      alt={label}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </button>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </StaggerSection>
  );
}

interface ImagePreviewModalProps {
  previewImage: string;
  surveyId: string;
  onClose: () => void;
}

export function ImagePreviewModal({ previewImage, surveyId, onClose }: ImagePreviewModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-8 print:hidden"
      onClick={onClose}
    >
      {/* Top Actions */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-[60]">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const res = await fetch(previewImage);
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `survey-photo-${surveyId || Date.now()}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (err) {
              // Fallback if CORS blocks the fetch
              window.open(previewImage, "_blank");
            }
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors backdrop-blur-md"
          title="Download Image"
        >
          <FiDownload size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors backdrop-blur-md"
          aria-label="Close preview"
        >
          <FiX size={20} />
        </button>
      </div>

      <img
        src={previewImage}
        alt="Full size preview"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-lg border border-gray-100"
      />
    </div>
  );
}
