# 🇩🇪 German Live Acquisition Companion (V2.1)

A real-time, camera-grounded multimodal German acquisition engine with Gemini Live styling, 100-source pedagogical hacks, and a dual-memory physical notebook loop.

---

## 📱 Mobile-First Gemini Live UI

The web app is optimized for mobile phones (Android Chrome & iOS Safari) and Desktop:
* **Fullscreen Camera View**: High-resolution video stream with 🔄 front/back camera flip.
* **Top Bar Controls**:
  * `🟢 Live / 🟡 Connecting / 🔴 Offline` Status Pill.
  * `💬 Live Subtitles Toggle`: Turn German captions on/off in real time.
  * `🔊 Audio Toggle`: Mute/unmute AI companion voice.
  * `🧠 Live Memory Drawer`: Slide up to inspect active skills, mastered words, case accuracies, and error logs.
  * `⚙️ Settings`: Configure API keys and voice models directly from the UI.
* **Bottom Floating Dock**:
  * `📞 Call Button`: Tap to start live video/audio companion call.
  * `🛑 End Session`: Immediately stops the call, compresses findings, and opens your physical notebook page.
  * `📝 Notebook Button`: Instant access to today's handwritten lesson & post-writing quiz.

---

## 🚀 How to Run (1-Click Launch)

### Option A: Double-Click on Windows
Just double-click **`START_APP.bat`** in this folder!

### Option B: Command Line
```powershell
python start_app.py
```

### 📲 How to Open on Your Phone:
1. Make sure your phone is connected to the same Wi-Fi network as your PC.
2. The terminal will print a **Scan QR Code** and your Phone URL (e.g. `http://192.168.1.X:8000`).
3. Open your phone's camera, scan the QR code, or type the URL into Chrome/Safari.
4. **Pro-Tip (Fullscreen App Mode)**: In your mobile browser menu, tap **"Add to Home Screen"** (*Zum Startbildschirm hinzufügen*). It will open full screen like a native FaceTime/Gemini app with no browser address bar!

---

## 🔑 API Keys & Configuration

* API keys are stored securely in **`config/settings.json`** or `.env`.
* You can also update or change your Gemini API key directly from inside the app's **`⚙️ Settings`** tab without touching any code.

---

## 🧪 Terminal Test Harness & Automated Tests

If you want to run the terminal drills or run unit tests:
```powershell
# Interactive Spoken Terminal Drill:
python session_runner.py

# Automated Demo:
python session_runner.py --demo

# Run 10/10 Unit Tests:
python -m unittest discover tests
```
