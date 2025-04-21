window.addEventListener("keydown", e => {
    const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
    if (!isTyping && [" ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
    }
});

const apparatus = {
    monitorWidthCm: null,
    monitorHeightCm: null,
    viewingDistance: null,
    screenWidthPx: null,
    screenHeightPx: null
};

// Measured image dimensions (e.g., based on your cropped image)
const initialCardWidthPx = 300;    // width in pixels
const initialCardHeightPx = 189;   // height in pixels (based on 6.7 × 4.3 aspect ratio)

// Known physical size of the image on first render (measured with a ruler)
const initialCardWidthCm = 6.7;
const initialCardHeightCm = 4.3;
const initialCardAspectRatio = initialCardWidthCm / initialCardHeightCm;

// Known real-world size of a standard credit card
const idealCardWidthCm = 8.56;
const idealCardHeightCm = 5.398;

// Set default values used in resizing
let cardWidth = initialCardWidthPx;
let cardHeight = initialCardHeightPx;

let pxPerCmX, pxPerCmY;

const design = {
    trialsPerBlock: 10,
    blocksPerSession: 3
};

const stimuli = [];
const procedure = [];
let editingIndex = null;
let editingStimulusIndex = null;

function updateSavedExperimentsDropdown() {
    const dropdown = document.getElementById("savedExperimentsDropdown");
    dropdown.innerHTML = `<option value="">-- Select a saved experiment --</option>`;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("experiment_")) {
            const name = key.replace("experiment_", "");
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            dropdown.appendChild(option);
        }
    }
}

function startCreditCardCalibration() {
    const overlay = document.getElementById("cardOverlay");
    overlay.classList.add("show");

    // Retrieve previous size from sessionStorage if available
    const savedW = parseFloat(sessionStorage.getItem("lastCardWidth"));
    const savedH = parseFloat(sessionStorage.getItem("lastCardHeight"));

    if (savedW && savedH) {
        cardWidth = savedW;
        cardHeight = savedH;
    }

    adjustCardSize();
}

function adjustCardSize() {
    const card = document.getElementById("cardSizer");
    card.style.width = `${cardWidth}px`;
    card.style.height = `${cardHeight}px`;

    const pxW = card.offsetWidth;
    const pxH = card.offsetHeight;

    const monitorResX = parseInt(document.getElementById("monitorResX").value);
    const monitorResY = parseInt(document.getElementById("monitorResY").value);

    // 🧠 Knowledge-Free: Assume current card is actual card
    const initialPxPerCmX = pxW / initialCardWidthCm;
    const initialPxPerCmY = pxH / initialCardHeightCm;

    const monitorWidthCm_Free = (monitorResX / initialPxPerCmX).toFixed(1);
    const monitorHeightCm_Free = (monitorResY / initialPxPerCmY).toFixed(1);

    // 📏 Knowledge-Based: Based on initial graphic image size
    // const pxPerCmX_known = initialCardWidthPx / initialCardWidthCm;
    // const pxPerCmY_known = initialCardHeightPx / initialCardHeightCm;

    // const cardWidthCm_current = (pxW / pxPerCmX_known).toFixed(2);
    // const cardHeightCm_current = (pxH / pxPerCmY_known).toFixed(2);

    const debugText = `
      <strong>🧠 Knowledge-Free Estimate</strong><br>
      Ideal card size (cm): ${idealCardWidthCm} × ${idealCardHeightCm}<br>
      Card on-screen (px): ${pxW}px × ${pxH}px<br>
      Estimated px/cm: ${initialPxPerCmX.toFixed(2)} × ${initialPxPerCmY.toFixed(2)}<br>
      Estimated monitor size: ${monitorWidthCm_Free}cm × ${monitorHeightCm_Free}cm<br><br>
    `;

    // debugText += `
    // <strong>📏 Knowledge-Based Estimate</strong><br>
    // Initial px/cm: ${pxPerCmX_known.toFixed(2)} × ${pxPerCmY_known.toFixed(2)}<br>
    // Card on-screen (px): ${pxW}px × ${pxH}px<br>
    // Card size (cm): ${cardWidthCm_current}cm × ${cardHeightCm_current}cm<br>
    // Estimated monitor size: ${monitorWidthCm_Real}cm × ${monitorHeightCm_Real}cm
    // `;
    // */</br>

    document.getElementById("cardInfo").innerHTML = debugText;
}

function finishCreditCardCalibration() {
    const pxWidth = cardWidth;
    const pxHeight = cardHeight;

    // Use the known px/cm values from initial card size
    const pxPerCmX = pxWidth / initialCardWidthCm;
    const pxPerCmY = pxHeight / initialCardHeightCm;

    const screenPxWidth = parseInt(document.getElementById("monitorResX").value);
    const screenPxHeight = parseInt(document.getElementById("monitorResY").value);

    const widthCm = (screenPxWidth / pxPerCmX).toFixed(1);
    const heightCm = (screenPxHeight / pxPerCmY).toFixed(1);

    document.getElementById("monitorWidth").value = widthCm;
    document.getElementById("monitorHeight").value = heightCm;
    document.getElementById("cardOverlay").classList.remove("show");

    sessionStorage.setItem("lastCardWidth", cardWidth);
    sessionStorage.setItem("lastCardHeight", cardHeight);
}

function autoDetectResolution() {
    const resX = screen.width * window.devicePixelRatio;
    const resY = screen.height * window.devicePixelRatio;

    document.getElementById("monitorResX").value = Math.round(resX);
    document.getElementById("monitorResY").value = Math.round(resY);
}

function updateVisualAngleInfo() {
    const summary = document.getElementById("visualAngleInfo");
    const m = design.monitor || {};

    const w = m.width;
    const h = m.height;
    const d = m.dist;
    const pxW = m.resX;
    const pxH = m.resY;

    if (w && h && d && pxW && pxH) {
        const degPerCm = 2 * Math.atan(1 / (2 * d)) * (180 / Math.PI);
        const pxPerCmX = pxW / w;
        const pxPerCmY = pxH / h;

        const degPerPxX = degPerCm / pxPerCmX;
        const degPerPxY = degPerCm / pxPerCmY;

        summary.innerHTML = `
      <strong>Saved Values:</strong><br>
      Monitor: ${w} cm × ${h} cm<br>
      Resolution: ${pxW} px × ${pxH} px<br>
      Viewing Distance: ${d} cm<br>
      <br>
      <strong>Conversion:</strong><br>
      1 cm = ${degPerCm.toFixed(4)}°<br>
      1 px (X) = ${degPerPxX.toFixed(4)}°<br>
      1 px (Y) = ${degPerPxY.toFixed(4)}°
    `;
    } else {
        summary.innerHTML = "Please fill in all apparatus fields to compute visual angle conversions.";
    }
}

function setApparatus() {
    const monitor = {
        width: parseFloat(document.getElementById("monitorWidth").value),
        height: parseFloat(document.getElementById("monitorHeight").value),
        resX: parseInt(document.getElementById("monitorResX").value),
        resY: parseInt(document.getElementById("monitorResY").value),
        dist: parseFloat(document.getElementById("viewingDistance").value)
    };

    design.monitor = monitor;
    updateVisualAngleInfo();
    saveExperimentToSession();
}

function addStimulus() {
    const name = document.getElementById('stimName').value.trim();
    if (stimuli.some(s => s.name === name)) {
        alert(`A stimulus named "${name}" already exists. Please use a different name.`);
        return;
    }

    const type = document.getElementById('stimType').value;

    if (!name) return;

    let content = "";
    if (type === "text") {
        const textInput = document.getElementById('stimContent');
        if (!textInput || !textInput.value.trim()) return;

        const lines = textInput.value.trim().split("\n").map(line => line.trim()).filter(line => line);
        content = lines.length > 1 ? lines : lines[0]; // Store array if multiple, string if single
    } else if (type === "polygon") {
        const shapeSelector = document.getElementById('stimContent');
        const colorInput = document.getElementById('polygonColor');
        const sizeInput = document.getElementById('polygonSize');

        if (!shapeSelector || !colorInput || !sizeInput) return;

        content = {
            shape: shapeSelector.value,
            color: colorInput.value,
            size: parseInt(sizeInput.value)
        };

    } else {
        const fileInput = document.getElementById('stimContentFile');
        if (!fileInput || fileInput.files.length === 0) return;
        content = fileInput.files[0].name;
    }

    if (editingStimulusIndex !== null) {
        // ✏️ Update existing stimulus
        stimuli[editingStimulusIndex] = { name, type, content };
        editingStimulusIndex = null;
        document.getElementById("addStimulusBtn").textContent = "Add Stimulus";
    } else {
        // ➕ Add new stimulus
        stimuli.push({ name, type, content });
    }

    // Reset UI
    document.getElementById('stimName').value = '';
    document.getElementById('stimType').value = 'text';
    updateStimulusInput();

    updateStimuliList();
    refreshStimulusSelector();
    saveExperimentToSession();
}

function updateStimuliList() {
    const list = document.getElementById('stimuliList');
    list.innerHTML = '';
    stimuli.forEach((stim, i) => {
        const li = document.createElement('li');

        if (i === editingStimulusIndex) {
            li.style.fontWeight = "bold";
        }

        // Format display
        if (stim.type === "text" && Array.isArray(stim.content)) {
            li.textContent = `${stim.name} → text: [${stim.content.join(", ")}]`;
        } else if (stim.type === "polygon") {
            const { shape, color, size } = stim.content;
            li.textContent = `${stim.name} → polygon: ${shape}, ${color}, ${size}px`;
        } else {
            li.textContent = `${stim.name} → ${stim.type}: ${stim.content}`;
        }

        // 🗑️ Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = "🗑️";
        delBtn.title = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = () => {
            const used = procedure.some(step =>
                step.stimuli.some(s => s.name === stim.name)
            );

            if (used) {
                alert(`Cannot delete "${stim.name}" — it is used in the procedure.\nPlease remove it from all displays first.`);
                return;
            }

            stimuli.splice(i, 1);
            updateStimuliList();
            refreshStimulusSelector();
            saveExperimentToSession();
            hasUnsavedChanges = true;
        };

        // ✏️ Edit/Cancel button
        const editBtn = document.createElement("button");
        editBtn.textContent = editingStimulusIndex === i ? "❌" : "✏️";
        editBtn.title = editingStimulusIndex === i ? "Cancel edit" : "Edit";
        editBtn.style.marginLeft = "5px";
        editBtn.onclick = () => {
            if (editingStimulusIndex === i) {
                // Cancel editing this stimulus
                editingStimulusIndex = null;
                document.getElementById("stimName").value = "";
                document.getElementById("stimType").value = "text";
                updateStimulusInput();
                document.getElementById("addStimulusBtn").disabled = false;
                document.getElementById("updateStimulusBtn").disabled = true;
                updateStimuliList(); // refresh
                return;
            }
            // Start editing this stimulus
            document.getElementById("stimName").value = stim.name;
            document.getElementById("stimType").value = stim.type;
            updateStimulusInput(); // update UI for type

            if (stim.type === "text") {
                const textarea = document.getElementById("stimContent");
                if (Array.isArray(stim.content)) {
                    textarea.value = stim.content.join("\n");
                } else {
                    textarea.value = stim.content;
                }
            } else if (stim.type === "polygon") {
                document.getElementById("stimContentShape").value = stim.content.shape;
                document.getElementById("stimContentColor").value = stim.content.color;
                document.getElementById("stimContentSize").value = stim.content.size;
            }

            editingStimulusIndex = i;

            document.querySelectorAll("#stimuliList li").forEach(li => {
                li.style.fontWeight = "normal";
            });
            li.style.fontWeight = "bold";

            document.getElementById("addStimulusBtn").disabled = true;
            document.getElementById("updateStimulusBtn").disabled = false;
            updateStimuliList();
        };

        li.appendChild(editBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function updateStimulusInput() {
    const type = document.getElementById("stimType").value;
    const wrapper = document.getElementById("stimContentWrapper");

    if (type === "text") {
        wrapper.innerHTML = `
        <label>Stimulus Content:
          <textarea id="stimContent" placeholder="Enter one option per line"></textarea>
        </label>`;
    } else if (type === "polygon") {
        wrapper.innerHTML = `
        <label>Polygon Shape:
          <select id="stimContent">
            <option value="triangle">Triangle</option>
            <option value="square">Square</option>
            <option value="circle">Circle</option>
          </select>
        </label>
        <label>Color:
          <input type="color" id="polygonColor" value="#ff0000">
        </label>
        <label>Size (px):
          <input type="number" id="polygonSize" value="80" min="10" max="300">
        </label>
      `;
    } else {
        wrapper.innerHTML = `
          <label>Stimulus File:
            <input type="file" id="stimContentFile" accept="${type}/*">
          </label>`;
    }
}

function updateStimulus() {
    if (editingStimulusIndex === null) return;

    const oldStimulus = stimuli[editingStimulusIndex];
    const oldName = oldStimulus.name;
    const newName = document.getElementById('stimName').value.trim();
    if (stimuli.some((s, idx) => s.name === newName && idx !== editingStimulusIndex)) {
        alert(`A stimulus named "${newName}" already exists. Please choose a unique name.`);
        return;
    }
    const type = document.getElementById('stimType').value;
    if (!newName) return;

    let content = "";
    if (type === "text") {
        const textInput = document.getElementById('stimContent');
        if (!textInput || !textInput.value.trim()) return;

        const lines = textInput.value.trim().split("\n").map(line => line.trim()).filter(line => line);
        content = lines.length > 1 ? lines : lines[0];
    } else if (type === "polygon") {
        content = {
            shape: document.getElementById('stimContentShape').value,
            color: document.getElementById('stimContentColor').value,
            size: parseInt(document.getElementById('stimContentSize').value),
        };
    } else {
        content = document.getElementById('stimContentFile')?.files[0]?.name || "";
    }

    // Check if name changed and stimulus is in use
    if (newName !== oldName) {
        const usedDisplays = procedure
            .filter(step => step.stimuli.some(s => s.name === oldName))
            .map(step => step.label);

        if (usedDisplays.length > 0) {
            const confirmMsg = `The stimulus "${oldName}" is used in the following display(s):\n${usedDisplays.join(", ")}\n\nRenaming it to "${newName}" will update all of these. Proceed?`;
            if (!confirm(confirmMsg)) return;

            // Update all references
            for (const step of procedure) {
                for (const stim of step.stimuli) {
                    if (stim.name === oldName) {
                        stim.name = newName;
                    }
                }
            }
            updateProcedureList();
        }
    }

    // Save update
    stimuli[editingStimulusIndex] = { name: newName, type, content };
    editingStimulusIndex = null;

    // Reset interface
    document.getElementById("stimName").value = "";
    document.getElementById("stimType").value = "text";
    updateStimulusInput();
    document.getElementById("addStimulusBtn").disabled = false;
    document.getElementById("updateStimulusBtn").disabled = true;
    updateStimuliList();
    refreshStimulusSelector();
    saveExperimentToSession();
}

function addDisplay() {
    const label = document.getElementById('displayName').value.trim();

    if (procedure.some(d => d.label === label)) {
        alert(`A display labeled "${label}" already exists. Please choose a unique name.`);
        return;
    }

    const untilResponse = document.getElementById("untilResponse").checked;
    const duration = untilResponse ? null : parseInt(document.getElementById('displayDuration').value);
    const responseKey = document.getElementById('responseKeyDisplay').dataset.key || "";

    const selectedStimuli = Array.from(document.querySelectorAll("input[name='displayStim']:checked"))
        .map(cb => cb.value);

    if (!label || (!untilResponse && isNaN(duration))) return;

    // if (selectedStimuli.length === 0) return;

    const stimWithLocations = selectedStimuli.map(name => {
        const posField = document.querySelector(`textarea[name="stimPos-${name}"]`);
        const positions = posField.value
            .trim()
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.startsWith("[") && line.endsWith("]"))
            .map(line => {
                const [x, y] = line.slice(1, -1).split(",").map(v => v.trim());
                return { x, y };
            });

        return {
            name,
            positions: positions.length > 1 ? positions : positions[0]
        };
    });

    procedure.push({ label, duration, stimuli: stimWithLocations, responseKey, untilResponse });

    updateProcedureList();
    saveExperimentToSession();
}

function updateDisplay() {
    if (editingIndex === null) return;

    // Same logic as addDisplay, but replaces instead of pushes
    const label = document.getElementById('displayName').value.trim();

    if (procedure.some((d, idx) => d.label === label && idx !== editingIndex)) {
        alert(`A display named "${label}" already exists. Please choose a different name.`);
        return;
    }

    const untilResponse = document.getElementById("untilResponse").checked;
    const duration = untilResponse ? null : parseInt(document.getElementById('displayDuration').value);

    const responseKeys = document.getElementById("responseKeyDisplay").dataset.key;

    const checkedStimuli = Array.from(document.querySelectorAll("input[name='displayStim']:checked")).map(cb => cb.value);
    const stimWithLocations = checkedStimuli.map(name => {
        const posField = document.querySelector(`textarea[name="stimPos-${name}"]`);
        const positions = posField.value
            .trim()
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.startsWith("[") && line.endsWith("]"))
            .map(line => {
                const [x, y] = line.slice(1, -1).split(",").map(v => v.trim());
                return { x, y };
            });

        return {
            name,
            positions: positions.length > 1 ? positions : positions[0]
        };
    });

    // Replace the display at the editing index
    procedure[editingIndex] = {
        label,
        duration,
        untilResponse,
        responseKey: responseKeys,
        stimuli: stimWithLocations
    };

    // Reset state
    editingIndex = null;
    updateProcedureList();
    clearDisplayForm();
}

function clearDisplayForm() {
    document.getElementById('displayName').value = "";
    document.getElementById('displayDuration').value = 500;
    document.getElementById('untilResponse').checked = false;
    toggleDuration();
    document.getElementById("responseKeyDisplay").dataset.key = "";
    document.getElementById("responseKeyDisplay").textContent = "None";

    // Clear key highlights
    document.querySelectorAll("#responseKeyKeyboard .key-button").forEach(btn => btn.classList.remove("selected"));

    // Uncheck all stimulus checkboxes
    document.querySelectorAll("input[name='displayStim']").forEach(cb => cb.checked = false);
    updateStimulusLocationInputs();

    // Enable Add button, disable Update button
    document.getElementById("addDisplayBtn").disabled = false;
    const updateBtn = document.getElementById("updateDisplayBtn");
    updateBtn.disabled = true;
    updateBtn.style.opacity = 0.5;
    updateBtn.style.cursor = "not-allowed";
}


function updateProcedureList() {
    const list = document.getElementById('procedureList');
    list.innerHTML = '';
    procedure.forEach((step, i) => {
        const li = document.createElement('li');
        if (i === editingIndex) {
            li.style.fontWeight = "bold";
        }

        const stimSummary = step.stimuli.map(s => {
            if (Array.isArray(s.positions)) {
                return `${s.name} @ [${s.positions.length} positions]`;
            } else if (s.positions) {
                return `${s.name} @ (${s.positions.x}, ${s.positions.y})`;
            } else {
                return `${s.name} @ (unknown)`;
            }
        }).join(", ");
        const durationText = step.untilResponse ? "until response" : `${step.duration} ms`;

        li.textContent = `${step.label} – ${durationText} – key: "${step.responseKey}" – stimuli: [${stimSummary}]`;

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = "🗑️";
        delBtn.title = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = () => {
            procedure.splice(i, 1);
            updateProcedureList();
            saveExperimentToSession();
            hasUnsavedChanges = true;
        };

        // Up button
        const upBtn = document.createElement('button');
        upBtn.textContent = "⬆️";
        upBtn.title = "Move up";
        upBtn.style.marginLeft = "10px";
        upBtn.disabled = i === 0;
        upBtn.onclick = () => {
            [procedure[i - 1], procedure[i]] = [procedure[i], procedure[i - 1]];
            updateProcedureList();
            saveExperimentToSession();
            hasUnsavedChanges = true;
        };

        // Down button
        const downBtn = document.createElement('button');
        downBtn.textContent = "⬇️";
        downBtn.title = "Move down";
        downBtn.style.marginLeft = "5px";
        downBtn.disabled = i === procedure.length - 1;
        downBtn.onclick = () => {
            [procedure[i], procedure[i + 1]] = [procedure[i + 1], procedure[i]];
            updateProcedureList();
            saveExperimentToSession();
            hasUnsavedChanges = true;
        };

        // ✏️ Edit/Cancel button
        const editBtn = document.createElement('button');
        editBtn.textContent = editingIndex === i ? "❌" : "✏️";
        editBtn.title = editingIndex === i ? "Cancel edit" : "Edit";
        editBtn.style.marginLeft = "10px";
        editBtn.onclick = () => {
            if (editingIndex === i) {
                // Cancel editing
                editingIndex = null;
                clearDisplayForm();
                updateProcedureList();
                return;
            }

            // Begin editing this display
            editingIndex = i;
            const step = procedure[i];
            document.getElementById("displayName").value = step.label;
            document.getElementById("displayDuration").value = step.duration ?? "";
            document.getElementById("untilResponse").checked = step.untilResponse;
            toggleDuration();

            // Fill included stimuli
            document.querySelectorAll("input[name='displayStim']").forEach(cb => {
                cb.checked = step.stimuli.some(s => s.name === cb.value);
            });
            updateStimulusLocationInputs();

            // Fill positions
            step.stimuli.forEach(s => {
                const box = document.querySelector(`textarea[name='stimPos-${s.name}']`);
                if (box) {
                    const text = Array.isArray(s.positions)
                        ? s.positions.map(pos => `[${pos.x}, ${pos.y}]`).join("\n")
                        : `[${s.positions.x}, ${s.positions.y}]`;
                    box.value = text;
                }
            });

            // Response key
            const displaySpan = document.getElementById("responseKeyDisplay");
            const keyboardContainer = document.getElementById("responseKeyKeyboard");

            displaySpan.dataset.key = step.responseKey;
            displaySpan.textContent = step.responseKey || "None";

            keyboardContainer.innerHTML = "";  // Clear previous keyboard
            renderKeyboard("responseKeyKeyboard", "responseKeyDisplay");

            document.getElementById("addDisplayBtn").disabled = true;
            document.getElementById("updateDisplayBtn").disabled = false;

            updateProcedureList(); // refresh
        };
        li.appendChild(editBtn);
        li.appendChild(upBtn);
        li.appendChild(downBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function editDisplay(index) {
    editingIndex = index;
    updateProcedureList();

    const step = procedure[index];

    // Set label
    document.getElementById('displayName').value = step.label;

    // Duration and until response
    const untilBox = document.getElementById("untilResponse");
    untilBox.checked = step.untilResponse;
    toggleDuration();
    if (!step.untilResponse) {
        document.getElementById("displayDuration").value = step.duration;
    }

    // Set response keys
    const keys = step.responseKey.split(",").map(k => k.trim());
    const span = document.getElementById("responseKeyDisplay");
    span.dataset.key = step.responseKey;
    span.textContent = keys.map(k => k === " " ? "Space" : k).join(", ");

    // Mark selected keys visually
    document.querySelectorAll("#responseKeyKeyboard .key-button").forEach(btn => {
        const actualKey = btn.dataset.key;
        btn.classList.toggle("selected", keys.includes(actualKey));
    });

    // Check relevant stimuli
    document.querySelectorAll("input[name='displayStim']").forEach(cb => {
        cb.checked = step.stimuli.some(s => s.name === cb.value);
    });

    // Refresh location inputs
    updateStimulusLocationInputs();

    // Set locations
    step.stimuli.forEach(stim => {
        const posBox = document.querySelector(`textarea[name="stimPos-${stim.name}"]`);
        if (posBox) {
            if (Array.isArray(stim.positions)) {
                posBox.value = stim.positions.map(p => `[${p.x}, ${p.y}]`).join("\n");
            } else if (stim.positions) {
                posBox.value = `[${stim.positions.x}, ${stim.positions.y}]`;
            }
        }
    });

    // Disable Add button
    document.getElementById("addDisplayBtn").disabled = true;

    // Enable Update button
    const updateBtn = document.getElementById("updateDisplayBtn");
    updateBtn.disabled = false;
    updateBtn.style.opacity = 1;
    updateBtn.style.cursor = "pointer";
}

function toggleDuration() {
    const checkbox = document.getElementById("untilResponse");
    const durationInput = document.getElementById("displayDuration");

    durationInput.disabled = checkbox.checked;

    if (checkbox.checked) {
        durationInput.placeholder = "Disabled (waiting for response)";
        durationInput.style.backgroundColor = "#eee";
    } else {
        durationInput.placeholder = "";
        durationInput.style.backgroundColor = "";
    }
}

function renderKeyboard(containerId, targetId) {
    const container = document.getElementById(containerId);
    container.className = "keyboard-container";
    // container.innerHTML = ""; // Clear any previous keyboard

    const keyboardRows = [
        ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Delete'],
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Ctrl', 'Meta', 'Alt', 'Space', 'Alt', 'Meta', 'Menu', 'Ctrl']
    ];

    keyboardRows.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "keyboard-row";

        row.forEach(key => {
            const button = document.createElement("div");
            button.className = "key-button";
            button.textContent = key;
            button.dataset.key = key.toLowerCase() === 'space' ? ' ' : key;
            button.onclick = () => {
                const actualKey = button.dataset.key;
                const displaySpan = document.getElementById(targetId);
                const currentKeys = displaySpan.dataset.key.split(",").filter(k => k);
                const isBreakKey = targetId === "breakResponseKeyDisplay";

                let updatedKeys;

                if (isBreakKey) {
                    // Exclusive selection for break key
                    const alreadySelected = currentKeys.includes(actualKey);

                    // Deselect if clicked again
                    updatedKeys = alreadySelected ? [] : [actualKey];

                    // Clear all selected styles from other keys
                    const allButtons = document.querySelectorAll(`#${containerId} .key-button`);
                    allButtons.forEach(btn => btn.classList.remove("selected"));

                    // Highlight the one that was selected
                    if (!alreadySelected) button.classList.add("selected");

                    // ✅ Update UI depending on break key selection
                    toggleBreakControls();

                } else {
                    // Allow multi-select for expected response keys
                    const alreadySelected = currentKeys.includes(actualKey);
                    if (alreadySelected) {
                        updatedKeys = currentKeys.filter(k => k !== actualKey);
                        button.classList.remove("selected");
                    } else {
                        updatedKeys = [...currentKeys, actualKey];
                        button.classList.add("selected");
                    }
                }
                // Update the display
                displaySpan.dataset.key = updatedKeys.join(",");
                displaySpan.textContent = updatedKeys.length
                    ? updatedKeys.map(k => (k === " " ? "Space" : k)).join(", ")
                    : "None";

                if (isBreakKey) {
                    toggleBreakControls();
                }
            };
            const widthClasses = {
                'Backspace': 'backspace',
                'Tab': 'tab',
                'CapsLock': 'capslock',
                'Enter': 'enter',
                'Shift': 'shift',
                'Delete': 'delete',
                'Space': 'space'
            };

            if (widthClasses[key]) {
                button.classList.add(widthClasses[key]);
            }

            rowDiv.appendChild(button);
        });
        container.appendChild(rowDiv);
    });
}

function refreshStimulusSelector() {
    const container = document.getElementById("displayStimCheckboxes");
    container.innerHTML = "";

    stimuli.forEach(stim => {
        const wrapper = document.createElement("label");
        wrapper.style.display = "block";
        wrapper.innerHTML = `
        <input type="checkbox" name="displayStim" value="${stim.name}">
        ${stim.name}
      `;
        container.appendChild(wrapper);
    });

    // Also reattach the location input logic
    container.querySelectorAll("input[type=checkbox]").forEach(checkbox => {
        checkbox.addEventListener("change", updateStimulusLocationInputs);
    });
}

function updateStimulusLocationInputs() {
    const checked = Array.from(document.querySelectorAll("input[name='displayStim']:checked"))
        .map(cb => cb.value);

    const locDiv = document.getElementById("stimulusLocations");
    locDiv.innerHTML = "";

    checked.forEach(name => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
        <strong>${name}</strong><br>
        Positions (one per line):<br>
        <textarea name="stimPos-${name}" rows="3" cols="30" placeholder='e.g., [50%, 50%]'></textarea>
      `;
        locDiv.appendChild(wrapper);
    });
}

function updateDesign() {
    design.trialsPerBlock = parseInt(document.getElementById('trialsPerBlock').value);
    design.blocksPerSession = parseInt(document.getElementById('blocksPerSession').value);
    design.interTrialInterval = parseInt(document.getElementById('interTrialInterval').value);
    design.blockMessage = document.getElementById('blockMessage').value.trim();
    design.responseKey = document.getElementById('responseKeyDisplay').dataset.key;
    design.breakResponseKey = document.getElementById('breakResponseKeyDisplay').dataset.key;
    const dur = parseInt(document.getElementById("breakDuration").value);
    design.breakDuration = isNaN(dur) ? null : dur;

    const totalTrials = design.trialsPerBlock * design.blocksPerSession;
    const breakControl = design.breakResponseKey && design.breakResponseKey !== ""
        ? `Break ends on key: "${design.breakResponseKey === " " ? "Space" : design.breakResponseKey}"`
        : `Break duration: ${design.breakDuration || "N/A"} ms`;

    document.getElementById('designSummary').innerHTML = `
      Experiment: ${design.blocksPerSession} blocks × ${design.trialsPerBlock} trials (${totalTrials} trials total)<br>
      Inter-trial interval: ${design.interTrialInterval || 0} ms<br>
      Break message: "${design.blockMessage || "N/A"}"<br>
      ${breakControl}
    `;

    saveExperimentToSession();
}

function toggleBreakControls() {
    const keyDisplay = document.getElementById("breakResponseKeyDisplay");
    const durInput = document.getElementById("breakDuration");

    const key = keyDisplay.dataset.key;
    const dur = durInput.value.trim();

    if (key) {
        durInput.disabled = true;
        durInput.placeholder = "Disabled (key selected)";
        durInput.style.backgroundColor = "#eee";
    } else {
        durInput.disabled = false;
        durInput.placeholder = "e.g., 3000";
        durInput.style.backgroundColor = "";
    }

    if (dur) {
        document.getElementById("breakResponseKeyKeyboard").style.pointerEvents = "none";
        document.getElementById("breakResponseKeyKeyboard").style.opacity = "0.6";
    } else {
        document.getElementById("breakResponseKeyKeyboard").style.pointerEvents = "auto";
        document.getElementById("breakResponseKeyKeyboard").style.opacity = "1";
    }
}

function clearCurrentExperiment() {
    const confirmed = confirm("⚠️ This will clear all currently loaded experiment data (apparatus, stimuli, procedure, and design).\n\nIf you want to keep this experiment, make sure to save it first.\n\nAre you sure you want to continue?");
    if (!confirmed) return;

    // Clear Apparatus fields
    document.getElementById("monitorWidth").value = "";
    document.getElementById("monitorHeight").value = "";
    document.getElementById("monitorResX").value = "";
    document.getElementById("monitorResY").value = "";
    document.getElementById("viewingDistance").value = "";
    document.getElementById("visualAngleInfo").textContent = "";

    // Clear Design fields
    document.getElementById("trialsPerBlock").value = "";
    document.getElementById("blocksPerSession").value = "";
    document.getElementById("interTrialInterval").value = "";
    document.getElementById("blockMessage").value = "";
    document.getElementById("breakDuration").value = "";

    document.getElementById("responseKeyDisplay").dataset.key = "";
    document.getElementById("responseKeyDisplay").textContent = "None";

    document.getElementById("breakResponseKeyDisplay").dataset.key = "";
    document.getElementById("breakResponseKeyDisplay").textContent = "None";

    document.getElementById("designSummary").textContent = "";

    // Clear Stimuli and Procedure
    stimuli.length = 0;
    procedure.length = 0;

    updateStimuliList();
    updateProcedureList();
    refreshStimulusSelector();
    updateStimulusLocationInputs();

    // Clear Global Design Object (but keep monitor key to avoid errors)
    design = { monitor: {} };

    // Remove from sessionStorage
    sessionStorage.removeItem("experimentBuilderData");

    hasUnsavedChanges = false;
}

async function runExperiment() {
    updateDesign(); // Ensure latest settings are pulled

    const container = document.getElementById("fullscreenContainer");
    container.style.display = "flex";
    container.innerHTML = "";

    const exitBtn = document.createElement("button");
    exitBtn.id = "exitButton";
    exitBtn.textContent = "Exit";
    exitBtn.onclick = () => {
        container.style.display = "none";
        container.innerHTML = "";
    };
    container.appendChild(exitBtn);

    for (let block = 0; block < design.blocksPerSession; block++) {
        for (let trial = 0; trial < design.trialsPerBlock; trial++) {
            for (const step of procedure) {
                container.innerHTML = "";
                container.appendChild(exitBtn);

                for (const stim of step.stimuli) {
                    const def = stimuli.find(s => s.name === stim.name);
                    if (!def) continue;

                    let elToRender;

                    if (def.type === "text") {
                        const content = Array.isArray(def.content)
                            ? def.content[Math.floor(Math.random() * def.content.length)]
                            : def.content;
                        elToRender = document.createElement("div"); // ✅ initialize the element!
                        elToRender.textContent = content;
                    } else if (def.type === "polygon") {
                        const { shape, color, size } = def.content;
                        elToRender = document.createElement("div");
                        elToRender.style.width = "80px";
                        elToRender.style.height = "80px";
                        elToRender.style.background = "red";

                        if (def.content === "circle") {
                            elToRender.style.borderRadius = "50%";
                        } else if (def.content === "triangle") {
                            elToRender.style.width = "0";
                            elToRender.style.height = "0";
                            elToRender.style.borderLeft = `${size / 2}px solid transparent`;
                            elToRender.style.borderRight = `${size / 2}px solid transparent`;
                            elToRender.style.borderBottom = `${size}px solid ${color}`;
                            elToRender.style.background = "none";
                        }
                    } else {
                        elToRender = document.createElement("div");
                        elToRender.textContent = `[${def.type}: ${def.content}]`;
                    }
                    // Determine randomized position
                    let x = "50%", y = "50%"; // fallback defaults
                    if (Array.isArray(stim.positions)) {
                        const pos = stim.positions[Math.floor(Math.random() * stim.positions.length)];
                        x = pos.x;
                        y = pos.y;
                    } else if (stim.positions) {
                        x = stim.positions.x;
                        y = stim.positions.y;
                    }

                    // Apply position and render
                    elToRender.style.position = "absolute";
                    elToRender.style.left = x;
                    elToRender.style.top = y;
                    elToRender.style.transform = "translate(-50%, -50%)"; // keep centered anchor
                    container.appendChild(elToRender);
                }

                if (step.untilResponse && step.responseKey) {
                    const validKeys = step.responseKey ? step.responseKey.split(",").map(k => k.trim()) : [];
                    await waitForKey(validKeys);
                } else {
                    await new Promise(r => setTimeout(r, step.duration));
                }
            }

            container.innerHTML = "";
            container.appendChild(exitBtn);
            await new Promise(r => setTimeout(r, design.interTrialInterval));
        }

        if (block < design.blocksPerSession - 1) {
            container.innerHTML = `<div>${design.blockMessage}</div>`;
            container.appendChild(exitBtn);

            if (design.breakResponseKey) {
                await waitForKey([design.breakResponseKey.toLowerCase()]);
            } else if (design.breakDuration) {
                await new Promise(r => setTimeout(r, design.breakDuration));
            }
        }
    }

    container.innerHTML = "<div>Experiment Complete!</div>";
    container.appendChild(exitBtn);
    await waitForKey([design.breakResponseKey.toLowerCase()]);
    container.style.display = "none";
    container.innerHTML = "";
}

function waitForKey(validKeys) {
    return new Promise(resolve => {
        function onKey(e) {
            const key = e.key.toLowerCase();
            if (validKeys.includes(key)) {
                document.removeEventListener("keydown", onKey);
                resolve();
            }
        }

        document.addEventListener("keydown", onKey);
    });
}

function saveExperimentToSession() {
    const experiment = {
        stimuli,
        procedure,
        design,
        apparatus
    };
    sessionStorage.setItem("experimentBuilderData", JSON.stringify(experiment));
}

function loadExperimentFromSession() {
    const saved = sessionStorage.getItem("experimentBuilderData");
    if (!saved) return;

    const data = JSON.parse(saved);

    // Restore to internal design object
    Object.assign(design, data.design);

    // Restore inputs (based on saved design)
    document.getElementById("trialsPerBlock").value = design.trialsPerBlock;
    document.getElementById("blocksPerSession").value = design.blocksPerSession;
    document.getElementById("interTrialInterval").value = design.interTrialInterval || 1000;
    document.getElementById("blockMessage").value = design.blockMessage || "Take a short break!";
    document.getElementById("breakDuration").value = design.breakDuration ?? "";

    if (design.monitor) {
        document.getElementById("monitorWidth").value = design.monitor.width;
        document.getElementById("monitorHeight").value = design.monitor.height;
        document.getElementById("monitorResX").value = design.monitor.resX;
        document.getElementById("monitorResY").value = design.monitor.resY;
        document.getElementById("viewingDistance").value = design.monitor.dist;
        updateVisualAngleInfo(); // restore visual angle info text
    }

    // Restore break response key text + visual
    const breakSpan = document.getElementById("breakResponseKeyDisplay");
    breakSpan.dataset.key = design.breakResponseKey || "";
    breakSpan.textContent = design.breakResponseKey === " " ? "Space" : design.breakResponseKey || "None";

    const breakButtons = document.querySelectorAll("#breakResponseKeyKeyboard .key-button");
    breakButtons.forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.key === design.breakResponseKey);
    });

    // Restore expected response key
    const responseSpan = document.getElementById("responseKeyDisplay");
    responseSpan.dataset.key = design.responseKey || "";
    responseSpan.textContent =
        (design.responseKey || "").split(",").map(k => k === " " ? "Space" : k).join(", ") || "None";

    const expectedButtons = document.querySelectorAll("#responseKeyKeyboard .key-button");
    expectedButtons.forEach(btn => {
        btn.classList.toggle("selected", (design.responseKey || "").split(",").includes(btn.dataset.key));
    });

    // ✅ NOW call updateDesign to sync design object + refresh summary
    updateDesign();

    // Stimuli + procedure
    stimuli.length = 0;
    stimuli.push(...data.stimuli || []);
    updateStimuliList();
    refreshStimulusSelector();

    procedure.length = 0;
    procedure.push(...data.procedure || []);
    updateStimulusLocationInputs();
    updateProcedureList();
}

function showSaveExperimentOverlay() {
    document.getElementById("saveExperimentOverlay").classList.add("show");
}

function hideSaveExperimentOverlay() {
    document.getElementById("saveExperimentOverlay").classList.remove("show");
}

function saveExperiment() {
    const name = document.getElementById("experimentNameInput").value.trim();
    if (!name) return;

    const fullExperiment = {
        design,
        stimuli,
        procedure
    };
    localStorage.setItem(`experiment_${name}`, JSON.stringify(fullExperiment));

    updateSavedExperimentsDropdown();
    hideSaveExperimentOverlay();
    alert(`Experiment "${name}" saved!`);
}

function loadSavedExperiment() {
    const selected = document.getElementById("savedExperimentsDropdown").value;
    if (!selected) return;

    const data = JSON.parse(localStorage.getItem(`experiment_${selected}`));
    if (!data) return;

    // Load design
    Object.assign(design, data.design);
    document.getElementById("trialsPerBlock").value = design.trialsPerBlock;
    document.getElementById("blocksPerSession").value = design.blocksPerSession;
    document.getElementById("interTrialInterval").value = design.interTrialInterval || 1000;
    document.getElementById("blockMessage").value = design.blockMessage || "Take a short break!";
    document.getElementById("monitorWidth").value = design.monitor?.width || "";
    document.getElementById("monitorHeight").value = design.monitor?.height || "";
    document.getElementById("monitorResX").value = design.monitor?.resX || "";
    document.getElementById("monitorResY").value = design.monitor?.resY || "";
    document.getElementById("viewingDistance").value = design.monitor?.dist || "";
    updateVisualAngleInfo();

    // Load stimuli
    stimuli.length = 0;
    stimuli.push(...data.stimuli || []);
    updateStimuliList();
    refreshStimulusSelector();

    // Load procedure
    procedure.length = 0;
    procedure.push(...data.procedure || []);
    updateStimulusLocationInputs();
    updateProcedureList();

    saveExperimentToSession();
}

window.addEventListener("beforeunload", function (e) {
    if (!hasUnsavedChanges) return;

    e.preventDefault();
    // Chrome requires returnValue to be set to show the prompt
    e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
});

window.addEventListener("DOMContentLoaded", () => {
    updateStimulusInput(); // ← THIS inserts the initial input into stimContentWrapper
    renderKeyboard("responseKeyKeyboard", "responseKeyDisplay");
    renderKeyboard("breakResponseKeyKeyboard", "breakResponseKeyDisplay");
    document.getElementById("breakDuration").addEventListener("input", toggleBreakControls);
    loadExperimentFromSession();
    toggleBreakControls();
    updateSavedExperimentsDropdown();

    window.addEventListener("keydown", function (e) {
        const overlay = document.getElementById("cardOverlay");
        if (!overlay.classList.contains("show")) return;

        switch (e.key) {
            case "ArrowUp":
                cardHeight *= 1.01; // increase height
                break;
            case "ArrowDown":
                cardHeight /= 1.01; // decrease height
                break;
            case "ArrowRight":
                cardWidth *= 1.01; // increase width
                break;
            case "ArrowLeft":
                cardWidth /= 1.01; // decrease width
                break;
            default:
                return; // do nothing
        }

        adjustCardSize();
    });

});