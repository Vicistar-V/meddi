# Meddi

## Inspiration

It started with my mom. I was visiting one day and watched her at the kitchen table, her weekly pill organizer open. She paused, holding two small, nearly identical white pills, a flicker of doubt in her eyes. In that instant, I saw the invisible stress that millions of our parents and loved ones face every single day. A routine that should be about healing was filled with anxiety. Is this the right one? Did I already take this? The consequences of a simple mistake could be serious.

Existing apps were just glorified alarms. They added to the noise but did nothing to solve the core problem: the deep-seated fear of getting it wrong. I knew we could do better. I wasn't inspired to build an app; I was inspired to build the peace of mind that my mom, and millions like her, deserve. That is the soul of Meddi.

## What it does

Meddi is a smart medication guardian that transforms a user's phone into a tool for safety and certainty. It's not a list, it's a companion that actively helps prevent errors and build a network of support.

*   **Effortless Setup:** Instead of confusing manual entry, Meddi uses AI to read a pharmacy label from a single photo. It instantly understands the medication, dosage, and instructions, building the user's schedule in seconds.
*   **Instant Verification:** For that critical moment of doubt, the user can simply point their camera at any pill. Meddi uses on-device computer vision to analyze it in real-time, providing an immediate on-screen confirmation: "Yes, this is your 8 AM Lisinopril."
*   **A Proactive Safety Net:** Before a new medication is even saved, Meddi silently checks it against the user's existing prescriptions for dangerous drug interactions, providing clear, critical warnings.
*   **Peace of Mind Connection (Caregiver Connect):** Users can now securely share their medication progress with a trusted family member. It's not about tracking; it's about providing shared reassurance through gentle, automatic updates and safety alerts.
*   **A Calm Dashboard:** Meddi presents a clean, simple view of the day, focusing only on the next dose. It makes logging medications a gentle, reassuring process, celebrating completion rather than punishing delays.

## How I built it

To build a tool worthy of my mom's trust, I chose a stack focused on security, speed, and cutting-edge intelligence.

*   **Foundation (Supabase):** I used Supabase for its secure authentication, PostgreSQL database, and storage. Most importantly, I enabled **Row-Level Security (RLS)** on every table from the start. To enable Caregiver Connect, I extended these RLS policies to create a secure, read-only view for a trusted family member, ensuring they could see progress without ever being able to alter the patient's data. A user's health data is sacred, and this architecture guarantees its privacy.
*   **Frontend (React & Vite):** The user interface was built with React, TypeScript, and Vite, creating a fast, reliable, and mobile-first experience that feels like a native application.
*   **Intelligent Onboarding (Gemini 1.5 Flash):** For the label scanner, I leveraged Google's Gemini model via a Supabase Edge Function. Instead of writing brittle parsing code, I focused on **prompt engineering**, instructing the AI to act as an expert pharmacist, extracting information from the image and returning a perfectly structured JSON object.
*   **Instant & Private Verification (TensorFlow.js):** The real-time pill identification is powered by a TensorFlow.js model running **directly in the user's browser**. This was a critical choice: it delivers instantaneous results while guaranteeing that the camera feed never leaves the user's device.
*   **Safety Check (OpenFDA API):** The drug interaction warnings are powered by a Supabase Edge Function that communicates directly with the official OpenFDA API, ensuring our safety alerts are based on reliable, authoritative data.

## Challenges I ran into

My biggest challenge was constantly asking: "Would my mom be able to use this without frustration?" This question forced me to abandon my first approach to label scanning and pivot to the much more intuitive Generative AI model. Implementing Caregiver Connect brought a new challenge: sharing data without compromising privacy. Writing the advanced Row-Level Security policies in Supabase was a complex but critical task. The system had to be foolproof, ensuring a caregiver could view information but never, under any circumstances, modify it. This wasn't just a technical problem; it was an ethical one.

Another significant challenge was performance. The on-device pill identifier had to feel instant. A slow, lagging analysis would only increase a user's anxiety. I spent hours optimizing the model and the browser's render loop to ensure the verification felt magical, not mechanical.

## Accomplishments that I'm proud of

I'm incredibly proud of the seamless flow from scanning a label to seeing that medication show up on the daily schedule, with a safety check performed in between. It's a complete safety loop.

But my proudest accomplishment is the feeling of the app. It's calm. It's reassuring. When a dose is taken, the positive feedback is designed to create a feeling of accomplishment, not just task completion. Now, with Caregiver Connect, that supportive partnership extends to the whole family. Knowing that a simple, secure feature can bridge the distance between a child and their parent, offering reassurance without intrusion, is the truest accomplishment of this project.

## What I learned

Beyond the technical skills, this project taught me a profound lesson: the most advanced technology is worthless if it doesn't serve a fundamental human need. Building for my mom was the ultimate design constraint. It forced me to prioritize simplicity, privacy, and empathy above all else. I learned that you don't build trust with complex features; you build it with unwavering reliability and a clear demonstration that you care about the user's well-being.

## What's next for Meddi

With Caregiver Connect now in place and providing a crucial support network, the cornerstone of our mission is complete. Meddi today solves the critical moment of taking a pill, but the journey of managing one's health is far greater. Here is the path forward:

### Phase 2: Closing the Loop with Smart Refills & Pharmacy Integration

The biggest point of failure in medication adherence is running out of pills. Meddi is uniquely positioned to prevent this.

**What it is:** A predictive refill management system. When Meddi scans a new label, the AI will also extract the pill quantity ("#30 Tablets"). Knowing the daily dosage, the app can accurately calculate and predict, "Your Lisinopril supply will run low in 7 days."

**The 'Why':** This moves Meddi from being reactive to proactive, eliminating human error. The ultimate vision is to integrate with major pharmacy APIs, allowing users to tap a single button to "Request a Refill" directly at their local pharmacy.

### Phase 3: Evolving into a Holistic Health Partner

A person's health is more than just the pills they take. The final evolution for Meddi is to understand the broader context of their health, transforming from a medication log into an intelligent health journal.

**What it is:** Expanding Meddi's AI to track and correlate more complex health metrics, from blood glucose readings for Diabetes Management to inhaler usage for Asthma & COPD.

**The 'Why':** This is where Meddi provides life-changing insights. The AI won't just log data; it will find patterns. It will help users see connections they might otherwise miss, like "Your blood sugar readings tend to be higher on mornings when your Metformin is logged late," empowering them to have more informed conversations with their doctor.

Ultimately, every future step is guided by our founding mission: to use technology with empathy to make medication safe, simple, and certain for everyone.
