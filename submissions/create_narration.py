import asyncio
import os
import edge_tts

VOICE = "en-IN-PrabhatNeural"  # Professional Indian English male neural voice

SCENES = [
    {
        "id": "scene1",
        "text": (
            "Hello everyone. This is Sumit Bahl presenting the Parent Decision Confidence System "
            "for NIAT, the NxtWave Institute of Advanced Technologies, for Round 1 of the Junior Growth Manager Challenge. "
            "In our 60-minute audit of NIAT's growth engine, we identified a critical bottleneck: funnels don't leak "
            "because of student enthusiasm; they leak during late-night parental deliberation. While students discover NIAT "
            "on YouTube and social channels, families make decisions together around the dinner table between 10 PM and 1 AM. "
            "Parents in Tier-2 and Tier-3 towns are understandably cautious about private degrees, UGC accreditation, and multi-lakh "
            "fee commitments. Because admissions counsellors are offline at night, unaddressed hesitation causes 60% of stalled leads "
            "to drop off completely. To solve this, we built a multi-component AI-native growth system deployed directly to parents on WhatsApp."
        )
    },
    {
        "id": "scene2",
        "text": (
            "Component 1 is our Multilingual AI Family Advisor. Here on the live platform, parents can ask raw, "
            "unfiltered questions in their native mother tongue, including Telugu, Hindi, Tamil, Kannada, Malayalam, and English. "
            "Let us switch to Telugu and ask: What is NIAT and how is the degree awarded? "
            "Notice the instant, objective response. Powered by Gemini 2.5 Flash with automatic pro fallbacks, the advisor doesn't give a sales pitch. "
            "It transparently clarifies that NIAT delivers the four-year tech curriculum, while UGC-recognized partner universities confer the formal B.Tech degree. "
            "Next, let's ask about the fee structure in English. The AI clearly outlines the 8 to 18 Lakh fee range across partner campuses and guides the family with zero pressure. "
            "When the family wants official follow-up, they enter their phone number for a counsellor callback, which immediately triggers Component 2."
        )
    },
    {
        "id": "scene3",
        "text": (
            "Behind the scenes, Component 2 instantly classifies the lead's objection category into Cost, Trust, Alternatives, or Timeline, and computes an intent score from 1 to 5. "
            "Now let's switch to Component 3: our Growth and Admissions Operations Portal at slash dashboard. "
            "Logging in with secure HMAC credentials, counsellors and growth managers get a real-time command center. Notice our KPI cards tracking active inquiries and primary objection trends. "
            "Right here is the Priority Follow-Up Queue. Leads scoring intent 4 or 5 are automatically pushed to the top. Counsellors can see the exact question the parent asked, the detected objection, and the lead's preferred language. "
            "For student privacy and regulatory compliance, phone numbers are masked by default. Clicking 'Reveal Number' decrypts the contact with an automated 30-second re-masking safety timer. "
            "Counsellors can launch a direct WhatsApp conversation with one click, or claim the lead using the 'Assign Counsellor' action. The entire pipeline can also be exported to safe or unmasked CSV for CRM sync."
        )
    },
    {
        "id": "scene4",
        "text": (
            "Let's look at the growth math. Across a cohort of 1,000 monthly leads, approximately 800 stall. "
            "With our AI Advisor intercepting hesitant families at midnight, rescuing just 10% of stalled leads yields 48 to 80 additional high-ticket admissions per cohort cycle, "
            "generating between 1.5 and 2.5 Crore Rupees in incremental revenue, while reducing counsellor response time from 4 hours to under 8 minutes. "
            "This entire system is production-deployed on Vercel at niat-app dot vercel dot app, verified with 16 automated tests and zero leaked credentials. "
            "Thank you for reviewing our submission!"
        )
    }
]

async def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    combined_script = []
    
    for scene in SCENES:
        out_file = os.path.join(out_dir, f"{scene['id']}.mp3")
        print(f"Generating audio for {scene['id']}...")
        communicate = edge_tts.Communicate(scene['text'], VOICE, rate="+3%")
        await communicate.save(out_file)
        print(f"Saved: {out_file} ({os.path.getsize(out_file)} bytes)")
        combined_script.append(scene['text'])
        
    # Generate full narration in one single master audio track
    full_text = " ... ".join([s["text"] for s in SCENES])
    master_file = os.path.join(out_dir, "master_narration.mp3")
    print("Generating master audio track...")
    comm_master = edge_tts.Communicate(full_text, VOICE, rate="+3%")
    await comm_master.save(master_file)
    print(f"Master narration saved: {master_file} ({os.path.getsize(master_file)} bytes)")

if __name__ == "__main__":
    asyncio.run(main())
