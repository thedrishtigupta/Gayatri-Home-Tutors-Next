
"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";

/* --------------------------------------------------------------------------
   FALLBACK / DEFAULT DATA OPTIONS
   -------------------------------------------------------------------------- */
const DEFAULT_OPTIONS = {
  qualifications: [
    { id: 1, name: "B.Tech / B.E." },
    { id: 2, name: "B.Sc (Bachelor of Science)" },
    { id: 3, name: "M.Sc (Master of Science)" },
    { id: 4, name: "M.Tech / M.E." },
    { id: 5, name: "B.Ed (Bachelor of Education)" },
    { id: 6, name: "M.Ed (Master of Education)" },
    { id: 7, name: "B.A. (Bachelor of Arts)" },
    { id: 8, name: "M.A. (Master of Arts)" },
    { id: 9, name: "B.Com / M.Com" },
    { id: 10, name: "Ph.D / Doctorate" },
    { id: 11, name: "Diploma / Certificate" },
  ],
  specializations: [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Physics" },
    { id: 3, name: "Chemistry" },
    { id: 4, name: "Computer Science & IT" },
    { id: 5, name: "Biology / Life Sciences" },
    { id: 6, name: "English Literature & Linguistics" },
    { id: 7, name: "Commerce & Accountancy" },
    { id: 8, name: "Economics & Finance" },
    { id: 9, name: "Social Sciences" },
    { id: 99, name: "Other" },
  ],
  classes: [
    { id: 1, name: "Pre-Primary / Nursery" },
    { id: 2, name: "Class 1 to 5 (Primary)" },
    { id: 3, name: "Class 6" },
    { id: 4, name: "Class 7" },
    { id: 5, name: "Class 8" },
    { id: 6, name: "Class 9" },
    { id: 7, name: "Class 10 (ICSE / CBSE / State)" },
    { id: 8, name: "Class 11 (Science)" },
    { id: 9, name: "Class 11 (Commerce)" },
    { id: 10, name: "Class 11 (Humanities/Arts)" },
    { id: 11, name: "Class 12 (Science)" },
    { id: 12, name: "Class 12 (Commerce)" },
    { id: 13, name: "Class 12 (Humanities/Arts)" },
    { id: 14, name: "IIT-JEE / NEET Foundation" },
    { id: 15, name: "Undergraduate / College" },
  ],
  subjects: [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Physics" },
    { id: 3, name: "Chemistry" },
    { id: 4, name: "Biology" },
    { id: 5, name: "English Core / Grammar" },
    { id: 6, name: "Computer Science / Python" },
    { id: 7, name: "Accountancy" },
    { id: 8, name: "Business Studies" },
    { id: 9, name: "Economics" },
    { id: 10, name: "Social Studies / History / Civics" },
    { id: 11, name: "Geography" },
    { id: 12, name: "Hindi" },
    { id: 13, name: "Sanskrit" },
    { id: 14, name: "French" },
    { id: 15, name: "Spanish" },
    { id: 16, name: "Vedic Maths / Mental Ability" },
  ],
  locations: [
    { id: 100, name: "Delhi NCR", location_type: "state", parent_location_id: null },
    { id: 200, name: "Maharashtra", location_type: "state", parent_location_id: null },
    { id: 300, name: "Karnataka", location_type: "state", parent_location_id: null },
    { id: 110, name: "New Delhi", location_type: "city", parent_location_id: 100 },
    { id: 120, name: "Gurgaon", location_type: "city", parent_location_id: 100 },
    { id: 130, name: "Noida", location_type: "city", parent_location_id: 100 },
    { id: 210, name: "Mumbai", location_type: "city", parent_location_id: 200 },
    { id: 310, name: "Bengaluru", location_type: "city", parent_location_id: 300 },
    { id: 1101, name: "South Extension / AIIMS", location_type: "locality", parent_location_id: 110 },
    { id: 1102, name: "Connaught Place / Central", location_type: "locality", parent_location_id: 110 },
    { id: 1103, name: "Dwarka Sector 1-23", location_type: "locality", parent_location_id: 110 },
    { id: 1104, name: "Rohini Sector 1-25", location_type: "locality", parent_location_id: 110 },
    { id: 1105, name: "Lajpat Nagar / Defence Colony", location_type: "locality", parent_location_id: 110 },
    { id: 1201, name: "DLF Phase 1 - 5", location_type: "locality", parent_location_id: 120 },
    { id: 1202, name: "Golf Course Road", location_type: "locality", parent_location_id: 120 },
    { id: 2101, name: "Bandra West / Khar", location_type: "locality", parent_location_id: 210 },
    { id: 2102, name: "Andheri West", location_type: "locality", parent_location_id: 210 },
    { id: 3101, name: "Koramangala / Indiranagar", location_type: "locality", parent_location_id: 310 },
    { id: 3102, name: "Whitefield / HSR", location_type: "locality", parent_location_id: 310 },
  ],
};

const createGroup = () => ({
  classIds: [],
  subjectIds: [],
  customSubjects: [],
});

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  gender: "",
  dob: "",
  maritalStatus: "",

  whatsapp: "",
  altNumber: "",
  email: "",
  familyMobile: "",
  relation: "",

  presentAddress: "",
  sameAsPresentAddress: false,
  permanentAddress: "",
  residentialStatus: "",

  highestQualificationId: "",
  specializationId: "",
  specializationOther: "",
  additionalQualification: "",
  englishFluency: "",

  teachingStartYear: "",
  schoolTeaching: "",
  schoolDetails: "",
  teachingMode: "",

  locationIds: [],

  teachingGroups: [createGroup()],

  advertisement: "",
  friendName: "",
  friendContact: "",
  comment: "",

  terms: false,
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1949 },
  (_, index) => CURRENT_YEAR - index
);

function cleanNumber(value) {
  return value.replace(/\D/g, "");
}

function toggleId(list, id) {
  const numericId = Number(id);
  if (list.includes(numericId)) {
    return list.filter((item) => item !== numericId);
  }
  return [...list, numericId];
}

/* --------------------------------------------------------------------------
   CUSTOM MULTI-SELECT DROPDOWN COMPONENT (NO ICONS)
   -------------------------------------------------------------------------- */
function MultiSelectDropdown({
  id,
  label,
  placeholder = "Select options...",
  options = [],
  selectedIds = [],
  onChange,
  required = false,
  allowOther = false,
  hasOtherSelected = false,
  onToggleOther,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((opt) => opt.name.toLowerCase().includes(term));
  }, [options, searchTerm]);

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => selectedIds.includes(Number(opt.id)));
  }, [options, selectedIds]);

  const toggleOption = (optionId) => {
    const numId = Number(optionId);
    if (selectedIds.includes(numId)) {
      onChange(selectedIds.filter((id) => id !== numId));
    } else {
      onChange([...selectedIds, numId]);
    }
  };

  const removeOption = (e, optionId) => {
    e.stopPropagation();
    const numId = Number(optionId);
    onChange(selectedIds.filter((id) => id !== numId));
  };

  const selectAll = () => {
    const allFilteredIds = filteredOptions.map((opt) => Number(opt.id));
    const combined = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    onChange(combined);
  };

  const clearAll = () => {
    if (!searchTerm.trim()) {
      onChange([]);
    } else {
      const filteredSet = new Set(filteredOptions.map((o) => Number(o.id)));
      onChange(selectedIds.filter((id) => !filteredSet.has(id)));
    }
  };

  return (
    <div className="tutor-field multiselect-container" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="tutor-label" id={`${id}-label`}>
          <span>{label}</span>
          {required && <span className="tutor-required">*</span>}
        </label>
        {(selectedIds.length > 0 || hasOtherSelected) && (
          <span className="multiselect-tag-count">
            {selectedIds.length + (hasOtherSelected ? 1 : 0)} selected
          </span>
        )}
      </div>

      <div
        id={id}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        className={`multiselect-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
      >
        <div className="multiselect-selected-area">
          {selectedOptions.length === 0 && !hasOtherSelected ? (
            <span className="multiselect-placeholder">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, 2).map((opt) => (
                <span key={opt.id} className="multiselect-tag">
                  <span className="truncate max-w-[130px]">{opt.name}</span>
                  <button
                    type="button"
                    className="multiselect-tag-remove"
                    aria-label={`Remove ${opt.name}`}
                    onClick={(e) => removeOption(e, opt.id)}
                  >
                    ×
                  </button>
                </span>
              ))}

              {hasOtherSelected && (
                <span className="multiselect-tag bg-amber-50 text-amber-800 border-amber-200">
                  <span>Other (+custom)</span>
                  <button
                    type="button"
                    className="multiselect-tag-remove text-amber-600 hover:text-amber-800 font-bold"
                    aria-label="Remove Other"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleOther) onToggleOther(false);
                    }}
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedOptions.length > 2 && (
                <span className="multiselect-tag-count">
                  +{selectedOptions.length - 2} more
                </span>
              )}
            </>
          )}
        </div>

        <span className={`multiselect-arrow-text ${isOpen ? "rotated" : ""}`}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div className="multiselect-dropdown" role="listbox">
          
          <div className="multiselect-search-box">
            <input
              ref={searchInputRef}
              type="text"
              className="multiselect-search-input"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 px-1 text-sm font-bold"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="multiselect-actions-row">
            <button
              type="button"
              className="multiselect-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                selectAll();
              }}
            >
              Select All
            </button>
            <button
              type="button"
              className="multiselect-action-btn text-slate-500 hover:text-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
            >
              Clear
            </button>
          </div>

          <div className="multiselect-list">
            {filteredOptions.length === 0 && !allowOther ? (
              <div className="multiselect-empty">No options matched.</div>
            ) : (
              <>
                {filteredOptions.map((opt) => {
                  const isSelected = selectedIds.includes(Number(opt.id));
                  return (
                    <div
                      key={opt.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`multiselect-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(opt.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="flex-1 text-xs sm:text-sm">
                        {opt.name}
                      </span>
                      {isSelected && (
                        <span className="text-blue-600 font-bold text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}

                {allowOther && (
                  <div
                    role="option"
                    aria-selected={hasOtherSelected}
                    className={`multiselect-item border-t border-slate-100 ${
                      hasOtherSelected ? "selected" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleOther) onToggleOther(!hasOtherSelected);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasOtherSelected}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1 text-xs sm:text-sm font-medium text-amber-700">
                      Other / Custom Subject...
                    </span>
                    {hasOtherSelected && (
                      <span className="text-amber-600 font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   INTERACTIVE INFO HOVER TOOLTIP COMPONENT (NO ICONS)
   -------------------------------------------------------------------------- */
function InfoHoverTooltip({ content, label = "More information" }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <span className="tutor-tooltip-container">
      <button
        ref={triggerRef}
        type="button"
        className={`tutor-tooltip-trigger ${isOpen ? "active" : ""}`}
        aria-label={label}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-xs font-bold leading-none select-none">i</span>
        <div role="tooltip" className="tutor-tooltip-popover">
          <div className="font-semibold text-sky-400 mb-1 text-xs">
            Group Making Guide
          </div>
          <p className="m-0 leading-relaxed text-slate-200 text-xs">
            {content}
          </p>
        </div>
      </button>
    </span>
  );
}

/* --------------------------------------------------------------------------
   TERMS & CONDITIONS MODAL PREVIEW (NO ICONS)
   -------------------------------------------------------------------------- */
function TermsModal({ isOpen, onClose, onAccept }) {
  if (!isOpen) return null;

  return (
    <div
      className="tutor-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-heading"
      onClick={onClose}
    >
      <div
        className="tutor-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tutor-modal-header">
          <div>
            <h3
              id="terms-modal-heading"
              className="tutor-modal-title text-base font-bold text-slate-900"
            >
              Tutor Agreement & Terms of Service
            </h3>
            <p className="text-xs text-slate-500 m-0">
              Mandatory terms for all registered educators
            </p>
          </div>
          <button
            type="button"
            className="tutor-modal-close text-base font-bold"
            onClick={onClose}
            aria-label="Close Terms"
          >
            ✕
          </button>
        </div>

        <div className="tutor-modal-content space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-md p-3 text-xs text-blue-900 leading-relaxed">
            <strong>Important:</strong> Acceptance of these terms is required to
            be listed and matched with tutoring opportunities on our platform.
          </div>

          <section className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              1. Credential Verification & Authenticity
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tutors must provide accurate personal, educational, and
              professional credentials. The administration reserves the right to
              verify certificates and identity documents before student
              assignment.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              2. Student Safety & Professionalism
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tutors are expected to uphold punctual session timings, structured
              academic syllabi, and maintain respectful, child-safe engagement at
              all times.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              3. Teaching Groups & Modality
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Teaching group pairings are utilized to streamline parent inquiries
              and match subject specialties. Tutors can update or expand their
              locality preferences at any time.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              4. Payment & Privacy Guarantee
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compensation payouts are disbursed according to the official
              schedule upon verified session completion. Your contact details
              are securely protected under our privacy standards.
            </p>
          </section>
        </div>

        <div className="tutor-modal-footer">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            onClick={onClose}
          >
            Close
          </button>
          {onAccept && (
            <button
              type="button"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
              onClick={() => {
                onAccept();
                onClose();
              }}
            >
              I Agree & Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   MAIN BECOME TUTOR FORM COMPONENT (ZERO ICONS)
   -------------------------------------------------------------------------- */
export default function BecomeTutorForm() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [highlightTermsError, setHighlightTermsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const response = await fetch("/api/tutors/options", {
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data) {
            setOptions({
              qualifications: data.qualifications?.length
                ? data.qualifications
                : DEFAULT_OPTIONS.qualifications,
              specializations: data.specializations?.length
                ? data.specializations
                : DEFAULT_OPTIONS.specializations,
              subjects: data.subjects?.length
                ? data.subjects
                : DEFAULT_OPTIONS.subjects,
              classes: data.classes?.length
                ? data.classes
                : DEFAULT_OPTIONS.classes,
              locations: data.locations?.length
                ? data.locations
                : DEFAULT_OPTIONS.locations,
            });
          }
        }
      } catch (err) {
        // Fallback to defaults
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo(
    () =>
      options.locations.filter(
        (location) => location.location_type === "state"
      ),
    [options.locations]
  );

  const cities = useMemo(
    () =>
      options.locations.filter((location) => location.location_type === "city"),
    [options.locations]
  );

  const localities = useMemo(
    () =>
      options.locations.filter(
        (location) => location.location_type === "locality"
      ),
    [options.locations]
  );

  const availableCities = useMemo(() => {
    if (!selectedStateId) return [];
    return cities.filter(
      (city) => Number(city.parent_location_id) === Number(selectedStateId)
    );
  }, [cities, selectedStateId]);

  const availableLocalities = useMemo(() => {
    if (!selectedCityId) return [];
    return localities.filter(
      (locality) =>
        Number(locality.parent_location_id) === Number(selectedCityId)
    );
  }, [localities, selectedCityId]);

  const selectedLocations = useMemo(
    () =>
      localities.filter((locality) =>
        form.locationIds.includes(Number(locality.id))
      ),
    [localities, form.locationIds]
  );

  function updateField(field, value) {
    setForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (field === "presentAddress" && previous.sameAsPresentAddress) {
        updated.permanentAddress = value;
      }

      return updated;
    });
  }

  function handleToggleSameAddress(e) {
    const isChecked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      sameAsPresentAddress: isChecked,
      permanentAddress: isChecked ? prev.presentAddress : prev.permanentAddress,
    }));
  }

  function handleStateChange(event) {
    const stateId = event.target.value;
    setSelectedStateId(stateId);
    setSelectedCityId("");
  }

  function handleCityChange(event) {
    const cityId = event.target.value;
    setSelectedCityId(cityId);
  }

  function toggleLocation(locationId) {
    setForm((previous) => ({
      ...previous,
      locationIds: toggleId(previous.locationIds, locationId),
    }));
  }

  function removeLocation(locationId) {
    setForm((previous) => ({
      ...previous,
      locationIds: previous.locationIds.filter(
        (id) => Number(id) !== Number(locationId)
      ),
    }));
  }

  function updateGroup(index, updater) {
    setForm((previous) => ({
      ...previous,
      teachingGroups: previous.teachingGroups.map((group, groupIndex) =>
        groupIndex === index ? updater(group) : group
      ),
    }));
  }

  function handleGroupClassesChange(groupIndex, classIds) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      classIds,
    }));
  }

  function handleGroupSubjectsChange(groupIndex, subjectIds) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      subjectIds,
    }));
  }

  function addTeachingGroup() {
    setForm((previous) => ({
      ...previous,
      teachingGroups: [...previous.teachingGroups, createGroup()],
    }));
  }

  function removeTeachingGroup(groupIndex) {
    setForm((previous) => ({
      ...previous,
      teachingGroups: previous.teachingGroups.filter(
        (_, index) => index !== groupIndex
      ),
    }));
  }

  function handleToggleOtherSubject(groupIndex, enabled) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      customSubjects: enabled
        ? group.customSubjects.length > 0
          ? group.customSubjects
          : [""]
        : [],
    }));
  }

  function updateCustomSubject(groupIndex, subjectIndex, value) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      customSubjects: group.customSubjects.map((subject, index) =>
        index === subjectIndex ? value : subject
      ),
    }));
  }

  function addCustomSubject(groupIndex) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      customSubjects: [...group.customSubjects, ""],
    }));
  }

  function removeCustomSubject(groupIndex, subjectIndex) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      customSubjects: group.customSubjects.filter(
        (_, index) => index !== subjectIndex
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    setHighlightTermsError(false);

    if (!form.teachingGroups.length) {
      setMessage("Please configure at least one teaching group.");
      setMessageType("error");
      return;
    }

    for (const [index, group] of form.teachingGroups.entries()) {
      if (!group.classIds.length) {
        setMessage(
          `Teaching Group ${index + 1}: Please select at least one class.`
        );
        setMessageType("error");
        return;
      }

      if (!group.subjectIds.length && !group.customSubjects.length) {
        setMessage(
          `Teaching Group ${index + 1}: Please select at least one subject.`
        );
        setMessageType("error");
        return;
      }

      const emptyCustomSubject = group.customSubjects.some(
        (subject) => !subject.trim()
      );
      if (emptyCustomSubject) {
        setMessage(
          `Please fill in the custom subject name in Teaching Group ${
            index + 1
          }.`
        );
        setMessageType("error");
        return;
      }
    }

    if (form.teachingMode !== "Online" && !form.locationIds.length) {
      setMessage(
        "Please select at least one teaching locality from the location section."
      );
      setMessageType("error");
      return;
    }

    if (!form.terms) {
      setHighlightTermsError(true);
      setMessage(
        "You must agree to the Terms & Conditions before submitting your application."
      );
      setMessageType("error");
      const termsElem = document.getElementById("terms");
      termsElem?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setMessage(
            "Application submitted successfully! Our onboarding team will contact you shortly."
          );
          setMessageType("success");
          setForm(INITIAL_FORM);
          setSelectedStateId("");
          setSelectedCityId("");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        throw new Error(data.error || "Unable to submit application.");
      }

      setMessage(
        "Your tutor application has been submitted successfully! Our onboarding team will contact you shortly."
      );
      setMessageType("success");
      setForm(INITIAL_FORM);
      setSelectedStateId("");
      setSelectedCityId("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(
        "Your tutor application has been submitted successfully! Our onboarding team will contact you shortly."
      );
      setMessageType("success");
      setForm(INITIAL_FORM);
      setSelectedStateId("");
      setSelectedCityId("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSpecialization = options.specializations.find(
    (item) => Number(item.id) === Number(form.specializationId)
  );
  const specializationIsOther =
    selectedSpecialization?.name?.trim().toLowerCase() === "other";

  if (loadingOptions) {
    return (
      <div id="tutor-form-container">
        <div className="tutor-alert tutor-alert-success">
          Loading tutor application form...
        </div>
      </div>
    );
  }

  return (
    <div>
      
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => {
          updateField("terms", true);
          setHighlightTermsError(false);
        }}
      />

      <form className="tutor-form" onSubmit={handleSubmit} noValidate>

        <div className="tutor-form-body">
          
          {message && (
            <div
              className={`tutor-alert ${
                messageType === "success"
                  ? "tutor-alert-success"
                  : "tutor-alert-error"
              }`}
              role="alert"
            >
              <span>{message}</span>
            </div>
          )}

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">Personal Information</h3>
            </div>

            <div className="tutor-grid tutor-grid-2">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="firstName">
                  First Name <span className="tutor-required">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="e.g. Rahul"
                  className="tutor-input"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required
                />
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="lastName">
                  Last Name <span className="tutor-required">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="e.g. Sharma"
                  className="tutor-input"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="tutor-grid tutor-grid-3">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="gender">
                  Gender <span className="tutor-required">*</span>
                </label>
                <select
                  id="gender"
                  className="tutor-select"
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="dob">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  className="tutor-input"
                  value={form.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                />
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="maritalStatus">
                  Marital Status <span className="tutor-required">*</span>
                </label>
                <select
                  id="maritalStatus"
                  className="tutor-select"
                  value={form.maritalStatus}
                  onChange={(e) => updateField("maritalStatus", e.target.value)}
                  required
                >
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">Contact Information</h3>
            </div>

            <div className="tutor-grid tutor-grid-3">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="whatsapp">
                  WhatsApp Number <span className="tutor-required">*</span>
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  className="tutor-input"
                  value={form.whatsapp}
                  onChange={(e) =>
                    updateField("whatsapp", cleanNumber(e.target.value))
                  }
                  required
                />
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="altNumber">
                  Alternative Number
                </label>
                <input
                  id="altNumber"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Optional alternate"
                  className="tutor-input"
                  value={form.altNumber}
                  onChange={(e) =>
                    updateField("altNumber", cleanNumber(e.target.value))
                  }
                />
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="email">
                  Email Address <span className="tutor-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@domain.com"
                  className="tutor-input"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="tutor-grid tutor-grid-2">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="familyMobile">
                  Emergency / Family Contact
                </label>
                <input
                  id="familyMobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Family phone number"
                  className="tutor-input"
                  value={form.familyMobile}
                  onChange={(e) =>
                    updateField("familyMobile", cleanNumber(e.target.value))
                  }
                />
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="relation">
                  Relationship with Contact
                </label>
                <input
                  id="relation"
                  type="text"
                  placeholder="e.g. Father, Mother, Spouse"
                  className="tutor-input"
                  value={form.relation}
                  onChange={(e) => updateField("relation", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">Residential Address</h3>
            </div>

            <div className="tutor-field">
              <label className="tutor-label" htmlFor="presentAddress">
                Present Address <span className="tutor-required">*</span>
              </label>
              <textarea
                id="presentAddress"
                rows={2}
                placeholder="House / Flat No., Street, Area, Landmark"
                className="tutor-textarea"
                value={form.presentAddress}
                onChange={(e) => updateField("presentAddress", e.target.value)}
                required
              />
            </div>

            <div
              className={`tutor-address-sync-card ${
                form.sameAsPresentAddress ? "checked" : ""
              }`}
              onClick={() => {
                const newVal = !form.sameAsPresentAddress;
                setForm((prev) => ({
                  ...prev,
                  sameAsPresentAddress: newVal,
                  permanentAddress: newVal
                    ? prev.presentAddress
                    : prev.permanentAddress,
                }));
              }}
            >
              <label
                className="tutor-sync-label"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  id="sameAsPresentAddress"
                  type="checkbox"
                  checked={form.sameAsPresentAddress}
                  onChange={handleToggleSameAddress}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="font-medium text-slate-800 text-sm">
                  Permanent address is same as present address
                </span>
              </label>
              {/* <span className="tutor-sync-badge">
                {form.sameAsPresentAddress ? "Synced" : "Separate Address"}
              </span> */}
            </div>

            <div className="tutor-field">
              <label className="tutor-label" htmlFor="permanentAddress">
                Permanent Address
                {form.sameAsPresentAddress && (
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    (Auto-synced with present address)
                  </span>
                )}
              </label>
              <textarea
                id="permanentAddress"
                rows={2}
                placeholder={
                  form.sameAsPresentAddress
                    ? "Permanent address auto-copied from present address"
                    : "Permanent residence address details"
                }
                className="tutor-textarea"
                value={form.permanentAddress}
                disabled={form.sameAsPresentAddress}
                onChange={(e) =>
                  updateField("permanentAddress", e.target.value)
                }
              />
            </div>

            <div className="tutor-field">
              <label className="tutor-label" htmlFor="residentialStatus">
                Residential Status <span className="tutor-required">*</span>
              </label>
              <select
                id="residentialStatus"
                className="tutor-select"
                value={form.residentialStatus}
                onChange={(e) =>
                  updateField("residentialStatus", e.target.value)
                }
                required
              >
                <option value="">Select status</option>
                <option value="Own">Own House</option>
                <option value="Rented">Rented Accommodation</option>
                <option value="Parental">Parental Home</option>
                <option value="PG/Hostel">PG / Hostel</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">
                Education & Qualification
              </h3>
            </div>

            <div className="tutor-grid tutor-grid-2">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="highestQualificationId">
                  Highest Qualification <span className="tutor-required">*</span>
                </label>
                <select
                  id="highestQualificationId"
                  className="tutor-select"
                  value={form.highestQualificationId}
                  onChange={(e) =>
                    updateField("highestQualificationId", e.target.value)
                  }
                  required
                >
                  <option value="">Select qualification</option>
                  {options.qualifications.map((qualification) => (
                    <option key={qualification.id} value={qualification.id}>
                      {qualification.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="specializationId">
                  Specialization <span className="tutor-required">*</span>
                </label>
                <select
                  id="specializationId"
                  className="tutor-select"
                  value={form.specializationId}
                  onChange={(e) => {
                    updateField("specializationId", e.target.value);
                    updateField("specializationOther", "");
                  }}
                  required
                >
                  <option value="">Select specialization</option>
                  {options.specializations.map((specialization) => (
                    <option key={specialization.id} value={specialization.id}>
                      {specialization.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {specializationIsOther && (
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="specializationOther">
                  Specify Specialization <span className="tutor-required">*</span>
                </label>
                <input
                  id="specializationOther"
                  type="text"
                  placeholder="Enter your field of specialization"
                  className="tutor-input"
                  value={form.specializationOther}
                  onChange={(e) =>
                    updateField("specializationOther", e.target.value)
                  }
                  required
                />
              </div>
            )}

            <div className="tutor-grid tutor-grid-2">
              <div className="tutor-field">
                <label
                  className="tutor-label"
                  htmlFor="additionalQualification"
                >
                  Additional Qualification / Certifications
                </label>
                <input
                  id="additionalQualification"
                  type="text"
                  placeholder="e.g. M.Sc. Mathematics, CTET, PhD"
                  className="tutor-input"
                  value={form.additionalQualification}
                  onChange={(e) =>
                    updateField("additionalQualification", e.target.value)
                  }
                />
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="englishFluency">
                  English Teaching Comfort{" "}
                  <span className="tutor-required">*</span>
                </label>
                <select
                  id="englishFluency"
                  className="tutor-select"
                  value={form.englishFluency}
                  onChange={(e) =>
                    updateField("englishFluency", e.target.value)
                  }
                  required
                >
                  <option value="">Select fluency</option>
                  <option value="Yes">Fluent (English Medium preferred)</option>
                  <option value="Average">Average / Conversational</option>
                  <option value="No">Hindi / Regional Medium preferred</option>
                </select>
              </div>
            </div>
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">Teaching Experience</h3>
            </div>

            <div className="tutor-grid tutor-grid-2">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="teachingStartYear">
                  Teaching Since <span className="tutor-required">*</span>
                </label>
                <select
                  id="teachingStartYear"
                  className="tutor-select"
                  value={form.teachingStartYear}
                  onChange={(e) =>
                    updateField("teachingStartYear", e.target.value)
                  }
                  required
                >
                  <option value="">Select year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="teachingMode">
                  Teaching Mode <span className="tutor-required">*</span>
                </label>
                <select
                  id="teachingMode"
                  className="tutor-select"
                  value={form.teachingMode}
                  onChange={(e) => updateField("teachingMode", e.target.value)}
                  required
                >
                  <option value="">Select mode</option>
                  <option value="In-person">
                    In-person / Offline (Home Tuition)
                  </option>
                  <option value="Online">Online Only (Live Sessions)</option>
                  <option value="Both">Both (In-person & Online)</option>
                </select>
              </div>
            </div>

            <div className="tutor-field">
              <label className="tutor-label" htmlFor="schoolTeaching">
                Do you currently teach in a formal school / institute?{" "}
                <span className="tutor-required">*</span>
              </label>
              <select
                id="schoolTeaching"
                className="tutor-select"
                value={form.schoolTeaching}
                onChange={(e) => updateField("schoolTeaching", e.target.value)}
                required
              >
                <option value="">Select an option</option>
                <option value="Yes">Yes, currently teaching in a school</option>
                <option value="No">No, full-time private tutor / freelance</option>
              </select>
            </div>

            {form.schoolTeaching === "Yes" && (
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="schoolDetails">
                  School Name & Branch Location{" "}
                  <span className="tutor-required">*</span>
                </label>
                <textarea
                  id="schoolDetails"
                  rows={2}
                  placeholder="e.g. DPS R.K. Puram, Mathematics Department"
                  className="tutor-textarea"
                  value={form.schoolDetails}
                  onChange={(e) =>
                    updateField("schoolDetails", e.target.value)
                  }
                  required
                />
              </div>
            )}
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">
                <span>Classes & Subjects You Teach</span>
                <InfoHoverTooltip
                  content="Create teaching groups to bundle classes with the specific subjects you teach for them. For example: Group 1 can be Class 9-10 (Maths & Science) and Group 2 can be Class 11-12 (Physics only)."
                  label="Teaching Group Instructions"
                />
              </h3>
            </div>

            <div className="space-y-4">
              {form.teachingGroups.map((group, groupIndex) => (
                <div
                  className="teaching-group-card"
                  key={groupIndex}
                  id={`teaching-group-${groupIndex + 1}`}
                >
                  <div className="teaching-group-card-header">
                    <div className="teaching-group-badge">
                      <span>Teaching Group {groupIndex + 1}</span>
                      <span className="teaching-group-pill-tag">
                        {group.classIds.length} Classes ·{" "}
                        {group.subjectIds.length + group.customSubjects.length}{" "}
                        Subjects
                      </span>
                    </div>

                    {form.teachingGroups.length > 1 && (
                      <button
                        type="button"
                        className="teaching-group-remove-btn"
                        onClick={() => removeTeachingGroup(groupIndex)}
                        title="Remove this teaching group"
                      >
                        Remove Group
                      </button>
                    )}
                  </div>

                  <div className="teaching-group-split">
                    <div>
                      <MultiSelectDropdown
                        id={`group-${groupIndex}-classes`}
                        label="Classes"
                        placeholder="Choose classes you teach..."
                        options={options.classes}
                        selectedIds={group.classIds}
                        onChange={(ids) =>
                          handleGroupClassesChange(groupIndex, ids)
                        }
                        required
                      />
                    </div>

                    <div>
                      <MultiSelectDropdown
                        id={`group-${groupIndex}-subjects`}
                        label="Subjects"
                        placeholder="Choose subjects for these classes..."
                        options={options.subjects}
                        selectedIds={group.subjectIds}
                        onChange={(ids) =>
                          handleGroupSubjectsChange(groupIndex, ids)
                        }
                        required
                        allowOther
                        hasOtherSelected={group.customSubjects.length > 0}
                        onToggleOther={(enabled) =>
                          handleToggleOtherSubject(groupIndex, enabled)
                        }
                      />

                      {group.customSubjects.length > 0 && (
                        <div className="custom-subjects-wrapper">
                          <label className="text-xs font-semibold text-slate-700">
                            Custom Subject Name(s):
                          </label>

                          {group.customSubjects.map(
                            (customSub, subIndex) => (
                              <div
                                key={subIndex}
                                className="custom-subject-input-row"
                              >
                                <input
                                  type="text"
                                  placeholder="e.g. Psychology, Coding, French"
                                  className="tutor-input text-xs py-1.5"
                                  value={customSub}
                                  onChange={(e) =>
                                    updateCustomSubject(
                                      groupIndex,
                                      subIndex,
                                      e.target.value
                                    )
                                  }
                                />
                                {group.customSubjects.length > 1 && (
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-semibold"
                                    onClick={() =>
                                      removeCustomSubject(groupIndex, subIndex)
                                    }
                                    title="Delete custom subject"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            )
                          )}

                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-start mt-1"
                            onClick={() => addCustomSubject(groupIndex)}
                          >
                            + Add another custom subject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="add-btn-secondary w-full justify-center py-2.5"
                onClick={addTeachingGroup}
              >
                + Add Another Teaching Group
              </button>
            </div>
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">
                <span>Where Can You Teach?</span>
                <InfoHoverTooltip
                  content="If you offer in-person home tutoring, choose your preferred state, city, and serviceable localities."
                  label="Location info"
                />
              </h3>
            </div>

            <div className="tutor-grid tutor-grid-2">
              <div className="tutor-field">
                <label className="tutor-label" htmlFor="locationState">
                  State
                </label>
                <select
                  id="locationState"
                  className="tutor-select"
                  value={selectedStateId}
                  onChange={handleStateChange}
                  disabled={form.teachingMode === "Online"}
                >
                  <option value="">Select state</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tutor-field">
                <label className="tutor-label" htmlFor="locationCity">
                  City
                </label>
                <select
                  id="locationCity"
                  className="tutor-select"
                  value={selectedCityId}
                  onChange={handleCityChange}
                  disabled={
                    !selectedStateId || form.teachingMode === "Online"
                  }
                >
                  <option value="">Select city</option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCityId && (
              <div className="tutor-field">
                <label className="tutor-label">
                  Select Localities / Neighborhoods
                </label>
                {availableLocalities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {availableLocalities.map((locality) => {
                      const isChecked = form.locationIds.includes(
                        Number(locality.id)
                      );
                      return (
                        <label
                          key={locality.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs transition-colors ${
                            isChecked
                              ? "bg-blue-50 text-blue-900 font-medium"
                              : "hover:bg-slate-200/60 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLocation(locality.id)}
                            disabled={form.teachingMode === "Online"}
                            className="rounded text-blue-600 w-3.5 h-3.5"
                          />
                          <span>{locality.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No specific localities registered for this city yet.
                  </p>
                )}
              </div>
            )}

            {selectedLocations.length > 0 && (
              <div className="selected-locations-bar">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Selected Localities ({selectedLocations.length}):
                </span>
                <div className="location-badges-wrap">
                  {selectedLocations.map((loc) => (
                    <span
                      key={loc.id}
                      className="location-pill"
                      onClick={() => removeLocation(loc.id)}
                      title="Click to remove"
                    >
                      <span>{loc.name}</span>
                      <span className="font-bold text-indigo-700 text-xs">
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="tutor-section">
            <div className="tutor-section-header">
              <h3 className="tutor-section-heading">Additional Details</h3>
            </div>

            <div className="tutor-field">
              <label className="tutor-label" htmlFor="advertisement">
                How did you hear about us?
              </label>
              <select
                id="advertisement"
                className="tutor-select"
                value={form.advertisement}
                onChange={(e) => updateField("advertisement", e.target.value)}
              >
                <option value="">Select an option</option>
                <option value="Google">Google Search</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Friend / Referral">Friend / Referral</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {form.advertisement === "Friend / Referral" && (
              <div className="tutor-grid tutor-grid-2">
                <div className="tutor-field">
                  <label className="tutor-label" htmlFor="friendName">
                    Referral Name <span className="tutor-required">*</span>
                  </label>
                  <input
                    id="friendName"
                    type="text"
                    placeholder="Friend's Full Name"
                    className="tutor-input"
                    value={form.friendName}
                    onChange={(e) =>
                      updateField("friendName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="tutor-field">
                  <label className="tutor-label" htmlFor="friendContact">
                    Referral Contact
                  </label>
                  <input
                    id="friendContact"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Friend's Phone"
                    className="tutor-input"
                    value={form.friendContact}
                    onChange={(e) =>
                      updateField("friendContact", cleanNumber(e.target.value))
                    }
                  />
                </div>
              </div>
            )}

            <div className="tutor-field">
              <label className="tutor-label" htmlFor="comment">
                Anything else you would like us to know?
              </label>
              <textarea
                id="comment"
                rows={3}
                placeholder="Mention specific achievements, teaching philosophy, or preferred hours..."
                className="tutor-textarea"
                value={form.comment}
                onChange={(e) => updateField("comment", e.target.value)}
              />
            </div>
          </section>

          <div
            className={`tutor-terms-card ${
              highlightTermsError ? "invalid-shake" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="tutor-compulsory-badge">
                Compulsory Agreement *
              </span>
            </div>

            <label className="tutor-terms-checkbox-wrap" htmlFor="terms">
              <input
                id="terms"
                type="checkbox"
                checked={form.terms}
                className="tutor-terms-input"
                onChange={(e) => {
                  updateField("terms", e.target.checked);
                  if (e.target.checked) setHighlightTermsError(false);
                }}
                required
              />
              <span className="tutor-terms-text">
                I agree to the{" "}
                <a
                  href="/terms"
                  className="tutor-terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsModalOpen(true);
                  }}
                >
                  Terms & Conditions
                </a>{" "}
                and acknowledge that all information provided is accurate and
                verifiable. <span className="tutor-required">*</span>
              </span>
            </label>

            {highlightTermsError && (
              <p className="text-xs text-red-600 font-medium m-0">
                You must tick this box to proceed with your tutor registration.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="tutor-submit-btn"
            disabled={submitting}
            id="submit-tutor-form"
          >
            {submitting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                <span>Submitting Application...</span>
              </>
            ) : (
              <span>Submit Tutor Application</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
