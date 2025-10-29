# Meddi

## Inspiration

It started with my mom. I was visiting one day and watched her at the kitchen table, her weekly pill organizer open. She paused, holding two small, nearly identical white pills, a flicker of doubt in her eyes. In that instant, I saw the invisible stress that millions of our parents and loved ones face every single day. A routine that should be about healing was filled with anxiety. Is this the right one? Did I already take this? The consequences of a simple mistake could be serious.

Existing apps were just glorified alarms. They added to the noise but did nothing to solve the core problem: the deep-seated fear of getting it wrong. I knew we could do better. I wasn't inspired to build an app; I was inspired to build the peace of mind that my mom, and millions like her, deserve. That is the soul of Meddi.

## What it does

Meddi is a smart medication guardian that transforms a user's phone into a tool for safety and certainty. It's not a list, it's a companion that actively helps prevent errors.

*   **Effortless Setup:** Instead of confusing manual entry, Meddi uses AI to read a pharmacy label from a single photo. It instantly understands the medication, dosage, and instructions, building the user's schedule in seconds.
*   **Instant Verification:** For that critical moment of doubt, the user can simply point their camera at any pill. Meddi uses on-device computer vision to analyze it in real-time, providing an immediate on-screen confirmation: "Yes, this is your 8 AM Lisinopril."
*   **A Proactive Safety Net:** Before a new medication is even saved, Meddi silently checks it against the user's existing prescriptions for dangerous drug interactions, providing clear, critical warnings to prevent a mistake before it can ever happen.
*   **A Calm Dashboard:** Meddi presents a clean, simple view of the day, focusing only on the *next* dose. It makes logging medications a gentle, reassuring process, celebrating completion rather than punishing delays.
*   **Caregiver Connect:** A secure, invitation-based feature that allows users to share their medication progress with a trusted family member or caregiver. Caregivers receive a simplified, read-only view of their loved one's schedule, providing peace of mind without being intrusive. This isn't about surveillance—it's about creating a shared sense of reassurance and closing the communication loop.

## How I built it

To build a tool worthy of my mom's trust, I chose a stack focused on security, speed, and cutting-edge intelligence.

*   **Foundation (Supabase):** I used Supabase for its secure authentication, PostgreSQL database, and storage. Most importantly, I enabled **Row-Level Security** on every table from the start. A user's health data is sacred, and this ensures it remains completely private to them.
*   **Frontend (React & Vite):** The user interface was built with React, TypeScript, and Vite, creating a fast, reliable, and mobile-first experience that feels like a native application.
*   **Intelligent Onboarding (Gemini 1.5 Flash):** For the label scanner, I leveraged Google's Gemini model via a Supabase Edge Function. Instead of writing brittle parsing code, I focused on **prompt engineering**, instructing the AI to act as an expert pharmacist, extracting information from the image and returning a perfectly structured JSON object.
*   **Instant & Private Verification (TensorFlow.js):** The real-time pill identification is powered by a TensorFlow.js model running **directly in the user's browser**. This was a critical choice: it delivers instantaneous results while guaranteeing that the camera feed never leaves the user's device, ensuring absolute privacy.
*   **Safety Check (OpenFDA API):** The drug interaction warnings are powered by a Supabase Edge Function that communicates directly with the official OpenFDA API, ensuring our safety alerts are based on reliable, authoritative data.

## Challenges I ran into

The journey wasn't without its hurdles. My biggest challenge was constantly asking: "Would my mom be able to use this without frustration?"

This question forced me to abandon my first approach to label scanning, which was a nightmare of complex code trying to guess what text meant. The breakthrough was reframing the problem for a generative AI model—it was far better at understanding context than my code ever could be.

Another significant challenge was performance. The on-device pill identifier had to feel instant. A slow, lagging analysis would only increase a user's anxiety. I spent hours optimizing the model and the browser's render loop to ensure the verification felt magical, not mechanical.

## Accomplishments that I'm proud of

I'm incredibly proud of the seamless flow from scanning a label to seeing that medication show up on the daily schedule, with a safety check performed in between. It's a complete safety loop.

But my proudest accomplishment is the feeling of the app. It's calm. It's reassuring. When a dose is taken, the positive feedback is designed to create a feeling of accomplishment, not just task completion. Building an application that feels like a supportive partner, rather than another chore, is what truly makes me proud of Meddi.

## What I learned

Beyond the technical skills, this project taught me a profound lesson: the most advanced technology is worthless if it doesn't serve a fundamental human need. Building for my mom was the ultimate design constraint. It forced me to prioritize simplicity, privacy, and empathy above all else. I learned that you don't build trust with complex features; you build it with unwavering reliability and a clear demonstration that you care about the user's well-being.

## What's next for Meddi

This is just the beginning. The journey continues with features like **smart refill reminders** that proactively alert users before medications run out, and expanding the AI's capabilities to handle more complex medication regimens with multiple interacting prescriptions. Future enhancements include **push notifications** for caregivers when doses are overdue, and integration with pharmacy systems for automated refill coordination. The mission remains constant: making medication management safe, simple, and stress-free for everyone.
