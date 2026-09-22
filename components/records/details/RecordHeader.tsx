import Image from "next/image";
import {
  FiArrowLeft,
  FiPrinter,
  FiEdit2,
  FiSave,
  FiX,
  FiLoader,
  FiTrash2,
} from "react-icons/fi";
import { Flag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { StaggerSection, SurveyDetail, OverallStatus, OVERALL_CONFIG, SURVEY_TYPE_LABELS } from "./Shared";

interface RecordHeaderProps {
  r: SurveyDetail;
  editing: boolean;
  saving: boolean;
  isAdmin: boolean;
  isVisitor: boolean;
  canEditRecord: boolean;
  isFlagging: boolean;
  overallStatus: string;
  overallCfg: (typeof OVERALL_CONFIG)[OverallStatus];
  onBack: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleFlag: () => void;
  saveError: string;
  record: SurveyDetail;
}

export function RecordHeader({
  r,
  editing,
  saving,
  isAdmin,
  isVisitor,
  canEditRecord,
  isFlagging,
  overallStatus,
  overallCfg,
  onBack,
  onStartEditing,
  onCancelEditing,
  onSave,
  onDelete,
  onToggleFlag,
  saveError,
  record,
}: RecordHeaderProps) {
  return (
    <>
      {/* Top bar — screen only */}
      <StaggerSection index={0}>
        <div className="flex items-center justify-between mb-3 print:hidden">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#027D3F] transition-colors group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <AnimatePresence mode="popLayout">
              {canEditRecord && !editing && (
                <motion.button
                  key="btn-edit"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={onStartEditing}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-[10px] hover:border-[#027D3F] hover:text-[#027D3F] transition-all"
                >
                  <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Edit
                </motion.button>
              )}
              {isAdmin && !editing && (
                <motion.button
                  key="btn-delete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-white bg-red-600 rounded-[10px] hover:bg-red-700 transition-all"
                >
                  <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Delete
                </motion.button>
              )}
              {editing && (
                <motion.div
                  key="btn-group-editing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 sm:gap-2"
                >
                  <button
                    onClick={onCancelEditing}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-all"
                  >
                    <FiX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-white bg-[#027D3F] rounded-[10px] hover:bg-[#02612f] disabled:opacity-60 transition-all"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <FiSave className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Save
                      </>
                    )}
                  </button>
                </motion.div>
              )}
              {!editing && !isVisitor && (() => {
                const isRecordFlagged = record?.overall_status === "Flagged" || record?.overall_status === "Fail";
                return (
                  <motion.button
                    key="btn-flag"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={onToggleFlag}
                    disabled={isFlagging}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold rounded-[10px] transition-all disabled:opacity-60
                      ${isRecordFlagged 
                        ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {isFlagging ? (
                      <FiLoader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Flag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRecordFlagged ? "fill-red-200" : ""}`} />
                    )}
                    {isRecordFlagged ? "Unflag" : "Flag"}
                  </motion.button>
                );
              })()}
              {!editing && (
                <motion.button
                  key="btn-print"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-all"
                >
                  <FiPrinter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Print
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </StaggerSection>

      {/* Banners */}
      {saveError && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-[#F5B9B9] bg-[#FDECEC] text-sm text-[#D81F26] print:hidden">
          {saveError}
        </div>
      )}
      {editing && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-[#E7E9A9] bg-[#F6F8D7] text-sm text-[#768A06] font-medium print:hidden">
          You are editing this record. Changes will be saved to the
          database.
        </div>
      )}

      {/* Hero Banner */}
      <StaggerSection index={1}>
        <div
          className="relative overflow-hidden rounded-[14px] border border-gray-100 print:rounded-none print:border-0 print:shadow-none"
          style={{
            backgroundImage: "url('/psb-header-green.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Optional subtle overlay for text readability if needed */}
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative z-10 px-5 sm:px-8 py-5 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
            
            {/* LEFT: Logo & Title */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[10px] sm:rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 p-2 sm:p-2.5">
                <Image
                  src="/psb_logo.png"
                  alt="Punjab & Sind Bank"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                  Punjab & Sind Bank
                </h1>
                <p className="text-[11px] sm:text-sm text-white/90 mt-0.5 font-medium">
                  Earthing Survey Report
                </p>
              </div>
            </div>

            {/* RIGHT: Status & Report ID */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t border-white/10 sm:border-0 mt-2 sm:mt-0">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30">
                <div className="text-white scale-90 sm:scale-100">
                  {overallCfg.icon}
                </div>
                <span className="text-[11px] sm:text-sm font-bold text-white">
                  Overall: {overallStatus || "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] sm:text-xs text-white/80 font-mono font-medium bg-black/20 px-2 py-1 rounded">
                  {r.survey_id}
                </span>
                <span className="text-[10px] sm:text-xs text-white/90 font-medium bg-black/20 px-2 py-1 rounded uppercase tracking-wider">
                  {SURVEY_TYPE_LABELS[r.survey_type as keyof typeof SURVEY_TYPE_LABELS] ?? r.survey_type ?? "SURVEY"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </StaggerSection>
    </>
  );
}
