/**
 * The owner's own description of their work, saved on 16 Nov 2026. It becomes the first entry in the
 * "About you" section (the `abouts` table) on a fresh database; after that, entries are edited in the app.
 */
export const defaultAbout = `I’m currently working as an AI Engineer at Parcera, where I’ve been deeply involved in building and developing our voice AI platform. My role goes beyond maintaining the system. I’ve contributed to bringing the platform to where it is today, working on the AI side as well as the underlying integrations and infrastructure.

A major part of my work involves researching and experimenting with different technologies to improve the platform. I continuously explore ways to reduce voice latency, improve speech-to-text and text-to-speech performance, make conversations more natural, and handle interruptions more effectively. I also work on the conversation engine, particularly how it understands customer requests, handles menus, identifies items and modifiers, manages carts, and connects everything to the POS.

I spend a lot of time investigating issues across different services. For example, we’ve faced situations where an authentication service failure caused the POS to return a 401 error, leaving the voice agent without menu access. We’ve also encountered permission-sync issues that restricted users to certain parts of the system. I trace these problems through logs, identify the root cause, implement fixes, and introduce safeguards to prevent them from happening again.

I also look for opportunities to automate repetitive processes. I've developed internal scripts and tools for deployments, data setup, and call-log analysis, helping reduce manual effort and make our development and testing workflows more efficient.

What I enjoy most is the combination of research, problem-solving, and building things from the ground up. I'm constantly exploring new approaches, testing different technologies, and finding practical ways to improve the platform rather than simply working with what's already available.

I'm currently pursuing a B.E. in AI and Machine Learning with a 9.0 CGPA. I primarily work with Python and Git and have hands-on experience with REST APIs, service integrations, and debugging distributed systems. While I haven't directly administered Salesforce, SAP, or NetSuite, I'm comfortable learning new platforms and understanding how they fit into a larger technical environment. I believe my experience building, researching, integrating, and maintaining a complex AI platform would allow me to contribute meaningfully to this role.`

export type About = { id: number; title: string; target: string | null; text: string; updatedAt: Date }

export const ABOUT_TITLE_MAX = 120

export const ABOUT_MAX = 6000
