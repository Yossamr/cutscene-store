import { motion } from "motion/react";

export function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="font-brand text-4xl font-black uppercase tracking-tighter text-brand-dark italic">About Us</h1>
      <p className="text-brand-dark/70 leading-relaxed">
        Welcome to Cutscene. We are passionate about bringing the magic of cinema into your everyday life through high-quality, curated merchandise. Our team of cinephiles works tirelessly to source the best apparel, accessories, and collectibles inspired by your favorite films.
      </p>
    </motion.div>
  );
}

export function Contact() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="font-brand text-4xl font-black uppercase tracking-tighter text-brand-dark italic">Contact Us</h1>
      <p className="text-brand-dark/70 leading-relaxed">
        Have a question or need support? We're here to help! Reach out to our customer service team at support@cutscene.com or call us at 1-800-CUTSCENE.
      </p>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="font-brand text-4xl font-black uppercase tracking-tighter text-brand-dark italic">FAQ</h1>
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-brand-dark">How long does shipping take?</h3>
          <p className="text-brand-dark/70 mt-2">Standard shipping usually takes 3-5 business days.</p>
        </div>
        <div>
          <h3 className="font-bold text-brand-dark">Do you ship internationally?</h3>
          <p className="text-brand-dark/70 mt-2">Yes, we ship worldwide! Shipping costs will apply and will be added at checkout.</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Terms() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="font-brand text-4xl font-black uppercase tracking-tighter text-brand-dark italic">Terms & Conditions</h1>
      <p className="text-brand-dark/70 leading-relaxed">
        By accessing and using Cutscene, you agree to comply with our terms of service. All content, trademarks, and data on this website are the property of Cutscene.
      </p>
    </motion.div>
  );
}

export function Returns() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="font-brand text-4xl font-black uppercase tracking-tighter text-brand-dark italic">Return Policy</h1>
      <p className="text-brand-dark/70 leading-relaxed">
        We accept returns within 30 days of purchase. Items must be unworn, unwashed, and in their original condition with tags attached.
      </p>
    </motion.div>
  );
}
