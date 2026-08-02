// components/forms/BecomeTutorForm.jsx
"use client";

import { useState } from "react";
import Link from "next/link";

const initialState = {
  firstName:"",lastName:"",gender:"",
  whatsapp:"",altNumber:"",email:"",
  familyMobile:"",relation:"",
  dob:"",maritalStatus:"",vehicle:"",
  presentAddress:"",permanentAddress:"",residentialStatus:"",
  qualification:"",additionalQualification:"",englishFluency:"",
  experience:"",schoolTeaching:"",schoolDetails:"",
  classes:"",subjects:"",areas:"",
  advertisement:"",friendName:"",friendContact:"",
  comment:"",terms:false,
};

export default function BecomeTutorForm() {
  const [form, setForm]       = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState(null);
  const [msg, setMsg]         = useState("");

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.terms) { alert("Please accept the Terms & Conditions."); return; }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/tutors", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatus("success");
      setMsg("Application submitted! Our team will review your details and get in touch soon.");
      setForm(initialState);
    } catch (err) {
      setStatus("error");
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="tutor-form book-demo-form" onSubmit={handleSubmit}>

      {status === "success" && <div className="form-success">✅ {msg}</div>}
      {status === "error"   && <div className="form-error">❌ {msg}</div>}

      {/* Personal Info */}
      <h3>Personal Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input type="text" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input type="text" id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="gender">Gender *</label>
          <select id="gender" name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
      </div>

      {/* Contact */}
      <h3>Contact Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="whatsapp">WhatsApp Number *</label>
          <input type="tel" id="whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="altNumber">Alternative Number</label>
          <input type="tel" id="altNumber" name="altNumber" value={form.altNumber} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="familyMobile">Family Member&apos;s Mobile *</label>
          <input type="tel" id="familyMobile" name="familyMobile" value={form.familyMobile} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="relation">Relation *</label>
          <input type="text" id="relation" name="relation" value={form.relation} onChange={handleChange} required />
        </div>
      </div>

      {/* Additional */}
      <h3>Additional Details</h3>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dob">Date of Birth *</label>
          <input type="date" id="dob" name="dob" value={form.dob} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="maritalStatus">Marital Status *</label>
          <select id="maritalStatus" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Single</option><option>Married</option><option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="vehicle">Own Vehicle *</label>
          <select id="vehicle" name="vehicle" value={form.vehicle} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Yes</option><option>No</option>
          </select>
        </div>
      </div>

      {/* Address */}
      <h3>Address Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="presentAddress">Present Address *</label>
          <textarea id="presentAddress" name="presentAddress" value={form.presentAddress} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="permanentAddress">Permanent Address (if different)</label>
          <textarea id="permanentAddress" name="permanentAddress" value={form.permanentAddress} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="residentialStatus">Residential Status *</label>
          <select id="residentialStatus" name="residentialStatus" value={form.residentialStatus} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Owned</option><option>Rented</option><option>PG/Hostel</option>
          </select>
        </div>
      </div>

      {/* Education */}
      <h3>Education</h3>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="qualification">Highest Qualification *</label>
          <input type="text" id="qualification" name="qualification" value={form.qualification} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="additionalQualification">Additional Qualification</label>
          <input type="text" id="additionalQualification" name="additionalQualification" value={form.additionalQualification} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="englishFluency">English Fluency *</label>
          <select id="englishFluency" name="englishFluency" value={form.englishFluency} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Basic</option><option>Intermediate</option><option>Fluent</option>
          </select>
        </div>
      </div>

      {/* Teaching */}
      <h3>Teaching Details</h3>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="experience">Experience (Years) *</label>
          <input type="number" id="experience" name="experience" min="0" value={form.experience} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="schoolTeaching">Teaching in a School? *</label>
          <select id="schoolTeaching" name="schoolTeaching" value={form.schoolTeaching} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Yes</option><option>No</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="schoolDetails">School Name &amp; Address</label>
        <textarea id="schoolDetails" name="schoolDetails" value={form.schoolDetails} onChange={handleChange} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="classes">Classes You Want to Teach *</label>
          <input type="text" id="classes" name="classes" value={form.classes} onChange={handleChange} placeholder="1st, 4th, 9th, 11th, B.Com, etc." required />
        </div>
        <div className="form-group">
          <label htmlFor="subjects">Subjects You Teach *</label>
          <input type="text" id="subjects" name="subjects" value={form.subjects} onChange={handleChange} placeholder="English, Maths, Chemistry, etc." required />
        </div>
        <div className="form-group">
          <label htmlFor="areas">Areas You Can Travel To *</label>
          <input type="text" id="areas" name="areas" value={form.areas} onChange={handleChange} placeholder="Pitampura, Rohini, etc." required />
        </div>
      </div>

      {/* Other */}
      <h3>Other Information</h3>
      <div className="form-group">
        <label htmlFor="advertisement">How did you hear about us? *</label>
        <input type="text" id="advertisement" name="advertisement" value={form.advertisement} onChange={handleChange} placeholder="Google, Facebook, Word of Mouth, etc." required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="friendName">Referred By (Name)</label>
          <input type="text" id="friendName" name="friendName" value={form.friendName} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="friendContact">Referral Contact</label>
          <input type="tel" id="friendContact" name="friendContact" value={form.friendContact} onChange={handleChange} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="comment">Any Comment or Suggestion</label>
        <textarea id="comment" name="comment" value={form.comment} onChange={handleChange} placeholder="Anything you'd like to share…" />
      </div>

      {/* Terms */}
      <div className="form-group">
        <div className="form-terms">
          <input type="checkbox" id="terms" name="terms" checked={form.terms} onChange={handleChange} required />
          <label htmlFor="terms">
            I have read and agree to the <Link href="/terms">Terms &amp; Conditions</Link> before submitting this form.
          </label>
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}
