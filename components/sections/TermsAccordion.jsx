// components/sections/TermsAccordion.jsx
"use client";

import { useState } from "react";

const TERMS = [
  {
    title: "General Safety & Responsibility",
    content: <ul>
      <li>Gayatri Home Tutors acts only as a <b>platform connecting tutors with students/parents.</b></li>
      <li>We are <b>not responsible for any misconduct, disputes, or issues</b> between tutors and students/parents.</li>
      <li>Both tutors and students/parents are advised to <b>verify each other's identity and ensure personal safety before starting tuition.</b></li>
      <li>Female tutors and students are especially advised to take appropriate <b>safety precautions before entering into any tutoring agreement.</b></li>
    </ul>,
  },
  {
    title: "Identity Verification",
    content: <ul>
      <li>Parents and students are advised to <b>verify the tutor's identity and address proof</b> before making any direct payment.</li>
      <li>Tutors must provide valid <b>identity proof, address proof, and educational documents</b> to Gayatri Home Tutors for verification.</li>
    </ul>,
  },
  {
    title: "Demo Class Policy",
    content: <ul>
      <li>Only <b>one free demo class</b> will be provided by the tutor.</li>
      <li>If the student continues with the tutor after the demo class, the <b>demo class will also be counted as a paid class.</b></li>
      <li>If a student requests <b>more than one demo class</b>, all classes including the first demo class will be chargeable.</li>
    </ul>,
  },
  {
    title: "Fee & Payment Policy (For Parents/Students)",
    content: <ul>
      <li>One month's tuition fee is <b>payable in advance.</b></li>
      <li>Parents are requested to make the payment <b>after the demo class or before the second class.</b></li>
      <li>Payments made to Gayatri Home Tutors are <b>not transferred to the tutor immediately.</b></li>
      <li>Tutors receive payment <b>after completion of the month's classes</b>, ensuring payment security for parents.</li>
    </ul>,
  },
  {
    title: "Tutor Registration & Documents",
    content: <>
      <p>Before receiving any home tuition assignment, tutors must submit:</p>
      <ul>
        <li>Two passport size photographs</li>
        <li>Photocopy of <b>identity proof and address proof</b> (Aadhar Card, Passport, Driving License, Voter ID, etc.)</li>
        <li>Photocopies of <b>educational certificates</b></li>
      </ul>
      <p>Assignments will be provided <b>only after successful verification of documents.</b></p>
    </>,
  },
  {
    title: "Tutor Commission Plans",
    content: <>
      <p>Tutors can choose one of the following commission plans:</p>
      <div className="terms-group" id="group-A">
        <h3>Plan A – 50% First Month Commission</h3>
        <ul>
          <li>No registration fee at the time of filling the tutor registration form.</li>
          <li>Tutors must pay <b>₹500 annually</b> before receiving any tuition assignment.</li>
          <li>This amount is <b>non-refundable and non-adjustable.</b></li>
          <li>Gayatri Home Tutors will charge <b>50% of the first month's tuition fee as commission.</b></li>
        </ul>
      </div>
      <div className="terms-group" id="group-B">
        <h3>Plan B – 60% First Month Commission</h3>
        <ul>
          <li>No registration fee at the time of filling the tutor registration form.</li>
          <li>No upfront payment is required before receiving assignments.</li>
          <li><b>Paid members may receive priority in assignments.</b></li>
          <li>Gayatri Home Tutors will charge <b>60% of the first month's tuition fee as commission.</b></li>
        </ul>
      </div>
    </>,
  },
  {
    title: "Tutor Payment Process",
    content: <ul>
      <li>The <b>first payment will be collected by Gayatri Home Tutors.</b></li>
      <li>After deducting the applicable commission (50% or 60%), the remaining amount will be <b>paid to the tutor at the end of the first month after classes are completed.</b></li>
    </ul>,
  },
  {
    title: "Short-Term Courses / Package Classes",
    content: <ul>
      <li>Gayatri Home Tutors will charge <b>30% commission of the total fees collected.</b></li>
      <li>The remaining amount will be <b>paid to the tutor based on mutual agreement.</b></li>
    </ul>,
  },
  {
    title: "Tutor Professional Conduct",
    content: <>
      <p>Tutors are expected to:</p>
      <ul>
        <li>Be punctual and professional</li>
        <li>Maintain proper behavior, communication, and appearance</li>
        <li>Follow ethical teaching practices</li>
      </ul>
      <p>Any serious complaint or misconduct may result in <b>removal from the Gayatri Home Tutors database.</b></p>
    </>,
  },
  {
    title: "Assignment & Performance Policy",
    content: <ul>
      <li>Tutors may be given <b>up to three opportunities</b> to prove their teaching performance.</li>
      <li>Future assignments will depend on the <b>tutor's performance and feedback from students/parents.</b></li>
    </ul>,
  },
  {
    title: "Commission on Continued Tuition",
    content: <ul>
      <li>If a tuition continues into the <b>next academic year</b>, the tutor must <b>pay commission again as per the selected plan.</b></li>
      <li>If a tuition is <b>referred to the tutor by an existing client</b>, commission rules will still apply.</li>
    </ul>,
  },
  {
    title: "Communication & Updates",
    content: <>
      <p>Tutors must inform Gayatri Home Tutors if:</p>
      <ul>
        <li>A student contacts them again <b>after a gap following a demo class.</b></li>
        <li>There is any <b>change in address, phone number, or contact details.</b></li>
      </ul>
      <p>Updated documents must be provided for verification.</p>
    </>,
  },
  {
    title: "Restrictions for Tutors",
    content: <>
      <p>Tutors must <b>not engage in activities unrelated to tutoring</b>, such as:</p>
      <ul>
        <li>Taking money for admissions to schools, colleges, or institutions.</li>
        <li>Misusing contact information of students or parents.</li>
      </ul>
    </>,
  },
  {
    title: "Tutor Relationship with Gayatri Home Tutors",
    content: <ul>
      <li>Tutors registered with Gayatri Home Tutors <b>are not employees of the organization.</b></li>
      <li>Gayatri Home Tutors <b>does not issue experience certificates</b> to registered tutors.</li>
    </ul>,
  },
  { title: "Modification of Terms",     content: <p>Gayatri Home Tutors reserves the right to <b>modify or update these Terms &amp; Conditions at any time without prior notice.</b></p> },
  { title: "Legal Jurisdiction",        content: <p>All disputes, if any, shall be <b>subject to the jurisdiction of Delhi only.</b></p> },
];

function AccordionItem({ title, content }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`accordion-header${open ? " active" : ""}`} onClick={() => setOpen(p => !p)}>
        {title}
      </button>
      <div className="accordion-content" style={{ maxHeight: open ? "1000px" : "0" }}>
        {content}
      </div>
    </>
  );
}

export default function TermsAccordion() {
  return (
    <div className="accordion">
      {TERMS.map(({ title, content }) => (
        <AccordionItem key={title} title={title} content={content} />
      ))}
    </div>
  );
}
