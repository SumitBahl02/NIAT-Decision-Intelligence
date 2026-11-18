Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop") # Clear, confident male voice for Sumit Bahl
$synth.Rate = 1 # Professional, crisp speaking pace

$outDir = "D:\Hackathon\niat-app\submissions"
$outFile = "$outDir\full_narration_male.wav"

$script = @"
Hello everyone. I am Sumit Bahl presenting the Parent Decision Confidence System for NIAT, the NxtWave Institute of Advanced Technologies, for Round 1 of the Junior Growth Manager Challenge.

During our 60-minute audit of NIAT's growth engine, we identified a critical bottleneck. Funnels do not leak because of lack of student enthusiasm; they leak during late-night parental deliberation. While students discover NIAT on YouTube and social channels, families make decisions together around the dinner table between 10 PM and 1 AM. Parents in Tier-2 and Tier-3 towns are cautious about private degrees, UGC accreditation, and multi-lakh fees. Because admissions counsellors are offline at night, unaddressed skepticism causes 60 percent of stalled leads to drop off.

To solve this, we engineered a multi-component AI-native growth system deployed directly to parents on WhatsApp.

Component 1 is our Multilingual AI Family Advisor. Live on the platform, parents can ask unfiltered questions in their native mother tongue, including Telugu, Hindi, Tamil, Kannada, Malayalam, and English.

Let us switch to Telugu and ask: What is NIAT and how is the degree awarded?
Notice the instant, objective response. Powered by Gemini 2.5 Flash, the advisor clearly clarifies that NIAT delivers the four-year technical curriculum, while UGC-recognized partner universities confer the formal B.Tech degree.

Next, let us ask about the fee structure in English. The AI transparently outlines the 8 to 18 Lakh fee range across partner campuses and guides families with zero pressure. When a family requests follow-up, entering their phone number immediately triggers Component 2.

Component 2 uses real-time classification to categorize the parent's objection into Cost, Trust, Alternatives, or Timeline, and scores buyer intent from 1 to 5.

Now let us switch to Component 3: our Growth and Admissions Operations Portal at slash dashboard.
Logging in with secure HMAC credentials, growth managers and counsellors access a live command center.
Notice the Priority Follow-Up Queue. Leads scoring intent 4 or 5 are automatically pushed to the top with their question, category, and preferred language.
To protect student privacy, phone numbers are masked by default. Clicking 'Reveal Number' decrypts the contact with an automated 30-second re-masking timer. Counsellors can launch a direct WhatsApp conversation with one click, assign the lead, and export safe or unmasked CSV data for CRM sync.

Looking at the growth economics: across 1,000 monthly leads, approximately 800 stall. By intercepting hesitant families at midnight, rescuing just 10 percent of stalled leads yields 48 to 80 additional admissions, generating 1.5 to 2.5 Crore Rupees in incremental cohort revenue while reducing counsellor response time from 4 hours to under 8 minutes.

This complete system is live in production on Vercel at niat-app dot vercel dot app, verified with 16 automated tests and zero leaked credentials.
Thank you for watching!
"@

$synth.SetOutputToWaveFile($outFile)
$synth.Speak($script)
$synth.Dispose()

Write-Output "Male narration generated successfully."
