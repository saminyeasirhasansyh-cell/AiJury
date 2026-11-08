# AI Jury on Render

A public jury room with ten animated bot jurors, file intake, visible arguments, votes, vetoes, evidence review, movable seats and play mode.

Deploy as a Render Node web service with build command `npm run build`, start command `npm start`, and health path `/healthz`. A `render.yaml` Blueprint is included. No server API key or database is required: visitors supply their own OpenAI key for the current browser tab. The app forwards it per request without storing it and never uses a creator key as a fallback. Continue in ChatGPT is a prompt handoff, not direct subscription access.

The server binds to 0.0.0.0 and honors Render's PORT variable. It supports streaming responses, forwards cancellation and handles the external HTTPS origin behind Render's proxy. Requires Node 22 or newer. No package dependencies are required.

Run locally with `npm run build` then `npm start`. Tests use a fictional fixture and mocked provider responses with no real API key.
