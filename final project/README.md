# RoomRender
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WebGL](https://img.shields.io/badge/WebGL-enabled-brightgreen.svg)](https://www.khronos.org/webgl/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-informational.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

RoomRender is a WebGL-based 3D room editor that allows you to design and customize interactive indoor environments right from your browser. With real-time rendering, a sleek UI, and tools to manipulate lights, furniture, and textures, it's perfect for prototyping spaces or testing design ideas.

# Main Features
- **Modular Room Layout**: Build and edit floors, walls, and furniture interactively.
- **Real-Time Material Editing**: Change textures and colors of surfaces using the GUI.
- **Dynamic Lighting System**: Add and adjust ambient, directional, and point lights.
- **Intuitive Camera Controls**: Orbit, zoom, and reset view with mouse, keyboard, or touch.
- **Object Model Importing**: Load external .obj furniture models and place them in the scene.
- **AI Assistant "Audrey"**: Receive layout and style suggestions from a built-in virtual designer.
- **Scene Export/Import**: Save and reload your room configurations as JSON.
- **Live Status Panel**: View current camera mode, FPS, and interaction state.

# Project Structure
```
assets/                   # Images and Videos used in the presentation
scenes/                   # Avaialable scenes to start working with
src/
├──objects/               # 3D objects 
├── textures/             # Material and surface textures
├── camera.js             # Managing camera modes 
├── input.js              # Mouse/keyboard input manager
├── main.js               # Main application logic
├── obj.js                # .OBJ file parser
├── objects.js            # Object creation/interaction logic
├── renderer.js           # WebGL rendering engine
├── scene.js              # Scene set-up and rendering updates
├── ui.js                 # Interface and controls
├── utils.js              # Helper functions
├── virtual_assistant.js  # Audrey's responses and logic
└── index.html            # HTML entry point
presentation.pdf          # Final project presentation
```

# Run Locally
1. Clone the repository
```bash
$ git clone https://github.com/your-username/roomrender.git
$ cd roomrender
```
2. Start a local server
``` bash
$ python -m http.server 8000
# or use VSCode Live Server
```

3. Open in browser
``` bash
Go to http://localhost:8000/src/index.html
```
# 
This project was developed as the final assignment for the course of Interactive Graphics at "La Sapienza" University of Rome, Academic Year 2024/2025.