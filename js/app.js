/**
 * Set Theory Interactive Visualizer
 * Handles logic for Venn diagram generation, input management, and validation.
 */

class VennApp {
    constructor() {
        this.state = {
            numSets: 3,
            universeSize: 100,
            regions: {}, // key: regionId, value: number
            currentSolution: null,
            setCardinalityTargets: {
                A: null,
                B: null,
                C: null,
                D: null,
            },
            regionCardinalityTargets: {},
        };

        // DOM Elements
        this.svg = document.getElementById('venn-svg');
        this.inputContainer = document.getElementById('input-container');
        this.setBtns = document.querySelectorAll('.set-btn');
        this.universeInput = document.getElementById('universe-size');
        this.currentSumEl = document.getElementById('current-sum');
        this.remainingEl = document.getElementById('remaining');
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusDot = this.statusIndicator.querySelector('.status-dot');
        this.statusText = this.statusIndicator.querySelector('.status-text');
        this.resetBtn = document.getElementById('reset-btn');
        this.setCardinalityList = document.getElementById('set-cardinality-list');
        this.regionCardinalityList = document.getElementById('region-cardinality-list');
        this.reportBtn = document.getElementById('report-btn');

        this.init();
    }

    init() {
        // Event Listeners
        this.setBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const count = parseInt(e.target.dataset.sets);
                this.updateSetCount(count);
                // Update UI active state
                this.setBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        this.universeInput.addEventListener('input', (e) => {
            this.state.universeSize = parseInt(e.target.value) || 0;
            this.state.currentSolution = null;
            this.updateStats();
        });

        this.resetBtn.addEventListener('click', () => {
            this.resetValues();
        });

        // Initialize Generator
        this.generator = new ProblemGenerator();
        this.solveBtn = document.getElementById('solve-btn');
        this.solveBtn.addEventListener('click', () => {
            this.generateProblem();
        });

        if (this.reportBtn) {
            this.reportBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // Initial Render
        this.renderVenn(this.state.numSets);
        this.renderSetCardinalityInputs();
        this.renderRegionCardinalityInputs();
        this.updateStats();
    }

    updateSetCount(count) {
        this.state.numSets = count;
        this.state.regions = {}; // Clear regions on switch
        this.state.currentSolution = null;
        this.renderVenn(count);
        this.renderSetCardinalityInputs();
        this.renderRegionCardinalityInputs();
        this.updateStats();
    }

    setStatus(status) {
        if (status === 'complete') {
            this.statusDot.style.backgroundColor = 'var(--success-color)';
            this.statusDot.style.boxShadow = '0 0 10px var(--success-color)';
            this.statusText.textContent = 'Completo';
            this.statusText.style.color = 'var(--success-color)';
        } else if (status === 'error') {
            this.statusDot.style.backgroundColor = 'var(--error-color)';
            this.statusDot.style.boxShadow = '0 0 10px var(--error-color)';
            this.statusText.textContent = 'Excede Universo';
            this.statusText.style.color = 'var(--error-color)';
        } else {
            this.statusDot.style.backgroundColor = 'var(--warning-color)';
            this.statusDot.style.boxShadow = '0 0 10px var(--warning-color)';
            this.statusText.textContent = 'Incompleto';
            this.statusText.style.color = 'var(--warning-color)';
        }
    }

    renderVenn(numSets) {
        this.svg.innerHTML = '';
        const container = this.inputContainer;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Palette
        const colors = [
            'rgba(56, 189, 248, 0.1)', // Light blue (A)
            'rgba(244, 114, 182, 0.1)', // Pink (B)
            'rgba(167, 139, 250, 0.1)', // Purple (C)
            'rgba(52, 211, 153, 0.1)'   // Green (D)
        ];
        const strokes = ['#38bdf8', '#f472b6', '#a78bfa', '#34d399'];

        // Universe
        this.drawRect(10, 10, 780, 580, 'none', 'var(--text-secondary)');
        this.addText(30, 45, "U", "var(--text-secondary)", "24px");
        this.addInput(750, 550, 'outside'); // Outside everything

        const cx = 400;
        const cy = 300;

        if (numSets === 1) {
            // 1 Set
            this.drawCircle(cx, cy, 150, colors[0], strokes[0]);
            this.addText(cx - 140, cy - 140, "A", strokes[0]);

            this.addInput(cx, cy, 'A');

        } else if (numSets === 2) {
            // 2 Sets
            const r = 140;
            const offset = 80;

            this.drawCircle(cx - offset, cy, r, colors[0], strokes[0]); // A
            this.drawCircle(cx + offset, cy, r, colors[1], strokes[1]); // B

            this.addText(cx - offset - r + 20, cy - r + 20, "A", strokes[0]);
            this.addText(cx + offset + r - 20, cy - r + 20, "B", strokes[1]);

            // Region Inputs
            this.addInput(cx - offset - 60, cy, 'A_only');
            this.addInput(cx + offset + 60, cy, 'B_only');
            this.addInput(cx, cy, 'AB');

        } else if (numSets === 3) {
            // 3 Sets - Symmetric
            // Scale R coords: A(-0.65, -0.375), B(0, 0.75), C(0.65, -0.375)
            // Scaling factor ~120
            const r = 160;
            const yOff = 20; // manual centering

            // Coord system in R is centered at (0,0). SVG (400, 300).
            // Y is flipped.
            const pA = { x: cx - 0.65 * 130, y: cy + 0.375 * 130 + yOff };
            const pB = { x: cx, y: cy - 0.75 * 130 + yOff };
            const pC = { x: cx + 0.65 * 130, y: cy + 0.375 * 130 + yOff };

            this.drawCircle(pA.x, pA.y, r, colors[0], strokes[0]);
            this.drawCircle(pB.x, pB.y, r, colors[1], strokes[1]);
            this.drawCircle(pC.x, pC.y, r, colors[2], strokes[2]);

            this.addText(pA.x - 185, pA.y + 20, "A", strokes[0]);
            this.addText(pB.x, pB.y - 170, "B", strokes[1]);
            this.addText(pC.x + 170, pC.y + 20, "C", strokes[2]);

            // Inputs
            // Pure regions
            this.addInput(pA.x - 80, pA.y + 40, 'A_only');
            this.addInput(pB.x, pB.y - 90, 'B_only');
            this.addInput(pC.x + 80, pC.y + 40, 'C_only');

            // Intersections
            this.addInput(cx - 65, cy - 40 + yOff, 'AB'); // A n B
            this.addInput(cx + 65, cy - 40 + yOff, 'BC'); // B n C
            this.addInput(cx, cy + 100 + yOff, 'AC');     // A n C

            // Center
            this.addInput(cx, cy + 20 + yOff, 'ABC');

        } else if (numSets === 4) {
            // 4 Sets - Symmetric diamond layout (reference-style)
            const rx = 95;
            const ry = 180;
            const rot = 45;
            const offset = 90;

            const centers = {
                A: { x: cx - offset, y: cy },
                B: { x: cx, y: cy - offset },
                C: { x: cx + offset, y: cy },
                D: { x: cx, y: cy + offset },
            };

            this.drawEllipse(centers.A.x, centers.A.y, rx, ry, rot, colors[0], strokes[0]);
            this.drawEllipse(centers.B.x, centers.B.y, rx, ry, rot, colors[1], strokes[1]);
            this.drawEllipse(centers.C.x, centers.C.y, rx, ry, rot, colors[2], strokes[2]);
            this.drawEllipse(centers.D.x, centers.D.y, rx, ry, rot, colors[3], strokes[3]);

            this.addText(centers.A.x - 140, centers.A.y - 10, "A", strokes[0]);
            this.addText(centers.B.x - 10, centers.B.y - 150, "B", strokes[1]);
            this.addText(centers.C.x + 110, centers.C.y - 10, "C", strokes[2]);
            this.addText(centers.D.x - 10, centers.D.y + 160, "D", strokes[3]);

            // INPUTS for 4 sets (16 regions total - 1 outside = 15 inside)
            // 1. Single Sets (Outer lobes)
            this.addInput(cx - 220, cy, 'A_only');
            this.addInput(cx, cy - 220, 'B_only');
            this.addInput(cx + 220, cy, 'C_only');
            this.addInput(cx, cy + 220, 'D_only');

            // 2. Pair Intersections (Between adjacent sets)
            this.addInput(cx - 90, cy - 90, 'AB');
            this.addInput(cx + 90, cy - 90, 'BC');
            this.addInput(cx + 90, cy + 90, 'CD');
            this.addInput(cx - 90, cy + 90, 'AD');

            // 3. Opposite pairs
            this.addInput(cx, cy - 50, 'AC');
            this.addInput(cx, cy + 50, 'BD');

            // 4. Triple intersections
            this.addInput(cx, cy - 90, 'ABC');
            this.addInput(cx - 90, cy, 'ABD');
            this.addInput(cx + 90, cy, 'BCD');
            this.addInput(cx, cy + 90, 'ACD');

            // Center
            this.addInput(cx, cy, 'ABCD');
        }
    }

    drawCircle(cx, cy, r, fill, stroke) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", fill);
        circle.setAttribute("stroke", stroke);
        circle.setAttribute("stroke-width", "2");
        circle.classList.add("venn-circle");
        this.svg.appendChild(circle);
    }

    drawEllipse(cx, cy, rx, ry, rot, fill, stroke) {
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipse.setAttribute("cx", cx);
        ellipse.setAttribute("cy", cy);
        ellipse.setAttribute("rx", rx);
        ellipse.setAttribute("ry", ry);
        ellipse.setAttribute("transform", `rotate(${rot} ${cx} ${cy})`);
        ellipse.setAttribute("fill", fill);
        ellipse.setAttribute("stroke", stroke);
        ellipse.setAttribute("stroke-width", "2");
        ellipse.classList.add("venn-circle");
        this.svg.appendChild(ellipse);
    }

    drawRect(x, y, w, h, fill, stroke) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", w);
        rect.setAttribute("height", h);
        rect.setAttribute("fill", fill);
        rect.setAttribute("stroke", stroke);
        rect.setAttribute("stroke-width", "2");
        rect.setAttribute("rx", "15");
        this.svg.appendChild(rect);
    }

    addText(x, y, text, color, size = "24px") {
        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textEl.setAttribute("x", x);
        textEl.setAttribute("y", y);
        textEl.setAttribute("fill", color);
        textEl.setAttribute("font-size", size);
        textEl.setAttribute("font-family", "Outfit, sans-serif");
        textEl.setAttribute("font-weight", "bold");
        textEl.textContent = text;
        this.svg.appendChild(textEl);
    }

    addInput(x, y, regionId) {
        // Convert SVG coordinates to DOM coordinates relative to the container
        // Note: This relies on SVG viewBox matching or scaling. 
        // A robust way uses getBoundingClientRect but since our SVG is viewBox 0 0 800 600
        // and container is responsive, we need percentage based positioning or bounding box calc.

        // For simplicity, we use % based on the 800x600 viewBox
        const leftPct = (x / 800) * 100;
        const topPct = (y / 600) * 100;

        const wrapper = document.createElement('div');
        wrapper.className = 'region-input-wrapper';
        wrapper.style.left = `${leftPct}%`;
        wrapper.style.top = `${topPct}%`;

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'region-input';
        input.dataset.region = regionId;
        input.placeholder = '0';

        input.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            this.state.regions[regionId] = val;
            this.updateStats();
        });

        wrapper.appendChild(input);
        this.inputContainer.appendChild(wrapper);
    }

    renderSetCardinalityInputs() {
        if (!this.setCardinalityList) return;

        this.setCardinalityList.innerHTML = '';
        const sets = ['A', 'B', 'C', 'D'].slice(0, this.state.numSets);
        const activeSetLookup = new Set(sets);

        sets.forEach(setChar => {
            const item = document.createElement('div');
            item.className = 'set-cardinality-item';
            item.dataset.set = setChar;

            const header = document.createElement('div');
            header.className = 'set-cardinality-header';

            const label = document.createElement('span');
            label.className = 'set-cardinality-label';
            label.textContent = `n(${setChar})`;

            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'set-cardinality-toggle';

            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.className = 'set-known-toggle';
            toggleInput.dataset.set = setChar;

            const toggleText = document.createElement('span');
            toggleText.textContent = 'Conocido';

            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(toggleText);
            header.appendChild(label);
            header.appendChild(toggleLabel);

            const body = document.createElement('div');
            body.className = 'set-cardinality-body';

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.className = 'set-cardinality-input';
            input.dataset.set = setChar;
            input.placeholder = '--';

            const current = document.createElement('span');
            current.className = 'set-cardinality-current';
            current.dataset.set = setChar;
            current.textContent = 'Actual: 0';

            body.appendChild(input);
            body.appendChild(current);
            item.appendChild(header);
            item.appendChild(body);
            this.setCardinalityList.appendChild(item);

            const existingTarget = this.state.setCardinalityTargets[setChar];
            if (existingTarget !== null) {
                toggleInput.checked = true;
                input.disabled = false;
                input.value = existingTarget;
            } else {
                toggleInput.checked = false;
                input.disabled = true;
                input.value = '';
            }

            toggleInput.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                input.disabled = !enabled;
                if (!enabled) {
                    input.value = '';
                    this.state.setCardinalityTargets[setChar] = null;
                } else {
                    const val = parseInt(input.value);
                    this.state.setCardinalityTargets[setChar] = Number.isNaN(val) ? null : val;
                }
                this.updateStats();
            });

            input.addEventListener('input', (e) => {
                if (!toggleInput.checked) return;
                const val = parseInt(e.target.value);
                this.state.setCardinalityTargets[setChar] = Number.isNaN(val) ? null : val;
                this.updateStats();
            });
        });

        Object.keys(this.state.setCardinalityTargets).forEach(setChar => {
            if (!activeSetLookup.has(setChar)) {
                this.state.setCardinalityTargets[setChar] = null;
            }
        });
    }

    getRegionDefinitions(numSets) {
        if (numSets === 1) {
            return [
                { id: 'A', label: 'A' },
            ];
        }

        if (numSets === 2) {
            return [
                { id: 'A_only', label: 'A - B' },
                { id: 'B_only', label: 'B - A' },
                { id: 'AB', label: 'A n B' },
            ];
        }

        if (numSets === 3) {
            return [
                { id: 'A_only', label: 'A - (B u C)' },
                { id: 'B_only', label: 'B - (A u C)' },
                { id: 'C_only', label: 'C - (A u B)' },
                { id: 'AB', label: 'A n B (sin C)' },
                { id: 'BC', label: 'B n C (sin A)' },
                { id: 'AC', label: 'A n C (sin B)' },
                { id: 'ABC', label: 'A n B n C' },
            ];
        }

        return [
            { id: 'A_only', label: 'A - (B u C u D)' },
            { id: 'B_only', label: 'B - (A u C u D)' },
            { id: 'C_only', label: 'C - (A u B u D)' },
            { id: 'D_only', label: 'D - (A u B u C)' },
            { id: 'AB', label: 'A n B (sin C,D)' },
            { id: 'BC', label: 'B n C (sin A,D)' },
            { id: 'CD', label: 'C n D (sin A,B)' },
            { id: 'AD', label: 'A n D (sin B,C)' },
            { id: 'AC', label: 'A n C (sin B,D)' },
            { id: 'BD', label: 'B n D (sin A,C)' },
            { id: 'ABC', label: 'A n B n C (sin D)' },
            { id: 'BCD', label: 'B n C n D (sin A)' },
            { id: 'ACD', label: 'A n C n D (sin B)' },
            { id: 'ABD', label: 'A n B n D (sin C)' },
            { id: 'ABCD', label: 'A n B n C n D' },
        ];
    }

    renderRegionCardinalityInputs() {
        if (!this.regionCardinalityList) return;

        this.regionCardinalityList.innerHTML = '';
        const regionDefs = this.getRegionDefinitions(this.state.numSets);
        const activeRegionIds = new Set(regionDefs.map(def => def.id));

        regionDefs.forEach(def => {
            const item = document.createElement('div');
            item.className = 'set-cardinality-item';
            item.dataset.region = def.id;

            const header = document.createElement('div');
            header.className = 'set-cardinality-header';

            const label = document.createElement('span');
            label.className = 'set-cardinality-label';
            label.textContent = def.label;

            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'set-cardinality-toggle';

            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.className = 'region-known-toggle';
            toggleInput.dataset.region = def.id;

            const toggleText = document.createElement('span');
            toggleText.textContent = 'Conocido';

            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(toggleText);
            header.appendChild(label);
            header.appendChild(toggleLabel);

            const body = document.createElement('div');
            body.className = 'set-cardinality-body';

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.className = 'set-cardinality-input';
            input.dataset.region = def.id;
            input.placeholder = '--';

            const current = document.createElement('span');
            current.className = 'set-cardinality-current';
            current.dataset.region = def.id;
            current.textContent = 'Actual: 0';

            body.appendChild(input);
            body.appendChild(current);
            item.appendChild(header);
            item.appendChild(body);
            this.regionCardinalityList.appendChild(item);

            const existingTarget = this.state.regionCardinalityTargets[def.id];
            if (existingTarget !== null && existingTarget !== undefined) {
                toggleInput.checked = true;
                input.disabled = false;
                input.value = existingTarget;
            } else {
                toggleInput.checked = false;
                input.disabled = true;
                input.value = '';
            }

            toggleInput.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                input.disabled = !enabled;
                if (!enabled) {
                    input.value = '';
                    this.state.regionCardinalityTargets[def.id] = null;
                } else {
                    const val = parseInt(input.value);
                    this.state.regionCardinalityTargets[def.id] = Number.isNaN(val) ? null : val;
                }
                this.updateStats();
            });

            input.addEventListener('input', (e) => {
                if (!toggleInput.checked) return;
                const val = parseInt(e.target.value);
                this.state.regionCardinalityTargets[def.id] = Number.isNaN(val) ? null : val;
                this.updateStats();
            });
        });

        Object.keys(this.state.regionCardinalityTargets).forEach(regionId => {
            if (!activeRegionIds.has(regionId)) {
                this.state.regionCardinalityTargets[regionId] = null;
            }
        });
    }

    getRegionValue(regionId) {
        return this.state.regions[regionId] || 0;
    }

    updateRegionCardinalityStatus() {
        const regionDefs = this.getRegionDefinitions(this.state.numSets);
        let hasOver = false;
        let allMatch = true;
        let anyKnown = false;

        regionDefs.forEach(def => {
            const target = this.state.regionCardinalityTargets[def.id];
            const current = this.getRegionValue(def.id);
            const item = this.regionCardinalityList
                ? this.regionCardinalityList.querySelector(`.set-cardinality-item[data-region="${def.id}"]`)
                : null;
            const currentEl = item
                ? item.querySelector('.set-cardinality-current')
                : null;

            if (currentEl) {
                currentEl.textContent = target === null || target === undefined
                    ? `Actual: ${current}`
                    : `Actual: ${current} / Obj: ${target}`;
            }

            if (item) {
                item.classList.remove('is-match', 'is-over');
            }

            if (target !== null && target !== undefined) {
                anyKnown = true;
                if (current > target) {
                    hasOver = true;
                    allMatch = false;
                    if (item) item.classList.add('is-over');
                } else if (current === target) {
                    if (item) item.classList.add('is-match');
                } else {
                    allMatch = false;
                }
            }
        });

        if (!anyKnown) {
            allMatch = true;
        }

        return { hasOver, allMatch };
    }

    getSetSum(setChar) {
        return Object.keys(this.state.regions).reduce((sum, key) => {
            if (key === 'outside') return sum;
            if (key === 'A') {
                return key.includes(setChar) ? sum + this.state.regions[key] : sum;
            }
            if (key.includes(setChar)) return sum + this.state.regions[key];
            return sum;
        }, 0);
    }

    updateSetCardinalityStatus() {
        const sets = ['A', 'B', 'C', 'D'].slice(0, this.state.numSets);
        let hasOver = false;
        let allMatch = true;
        let anyKnown = false;

        sets.forEach(setChar => {
            const target = this.state.setCardinalityTargets[setChar];
            const current = this.getSetSum(setChar);
            const item = this.setCardinalityList
                ? this.setCardinalityList.querySelector(`.set-cardinality-item[data-set="${setChar}"]`)
                : null;
            const currentEl = item
                ? item.querySelector('.set-cardinality-current')
                : null;

            if (currentEl) {
                currentEl.textContent = target === null
                    ? `Actual: ${current}`
                    : `Actual: ${current} / Obj: ${target}`;
            }

            if (item) {
                item.classList.remove('is-match', 'is-over');
            }

            if (target !== null) {
                anyKnown = true;
                if (current > target) {
                    hasOver = true;
                    allMatch = false;
                    if (item) item.classList.add('is-over');
                } else if (current === target) {
                    if (item) item.classList.add('is-match');
                } else {
                    allMatch = false;
                }
            }
        });

        if (!anyKnown) {
            allMatch = true;
        }

        return { hasOver, allMatch };
    }

    generateProblem() {
        const problem = this.generator.generate(this.state.numSets, this.state.universeSize);
        this.state.currentSolution = problem.solution;

        const problemBox = document.getElementById('problem-container');
        const problemText = document.getElementById('problem-text');

        problemBox.classList.remove('hidden');
        problemText.innerHTML = problem.text;

        this.resetValues();
    }

    resetValues() {
        this.state.regions = {};
        const inputs = document.querySelectorAll('.region-input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('correct', 'incorrect');
        });
        this.updateStats();
    }

    updateStats() {
        const currentSum = Object.values(this.state.regions).reduce((a, b) => a + b, 0);
        const remaining = this.state.universeSize - currentSum;

        this.currentSumEl.textContent = currentSum;
        this.remainingEl.textContent = remaining;

        const setStatus = this.updateSetCardinalityStatus();
        const regionStatus = this.updateRegionCardinalityStatus();
        const universeOver = currentSum > this.state.universeSize;
        const solutionComplete = this.state.currentSolution ? this.validateAgainstSolution() : false;

        if (universeOver || setStatus.hasOver || regionStatus.hasOver) {
            this.setStatus('error');
        } else if (
            (this.state.currentSolution && solutionComplete && setStatus.allMatch && regionStatus.allMatch) ||
            (!this.state.currentSolution && currentSum === this.state.universeSize && setStatus.allMatch && regionStatus.allMatch)
        ) {
            this.setStatus('complete');
        } else {
            this.setStatus('incomplete');
        }
    }

    validateAgainstSolution() {
        const solution = this.state.currentSolution;
        let allCorrect = true;
        let totalFilled = 0;

        const inputs = document.querySelectorAll('.region-input');
        inputs.forEach(input => {
            const region = input.dataset.region;
            const val = parseInt(input.value);

            if (!isNaN(val)) {
                totalFilled++;
                if (val === solution[region]) {
                    input.classList.add('correct');
                    input.classList.remove('incorrect');
                } else {
                    input.classList.add('incorrect');
                    input.classList.remove('correct');
                    allCorrect = false;
                }
            } else {
                input.classList.remove('correct', 'incorrect');
                allCorrect = false;
            }
        });

        if (allCorrect && totalFilled === Object.keys(solution).length) {
            return true;
        }
        return false;
    }

    getRegionDisplayValue(regionId) {
        return Object.prototype.hasOwnProperty.call(this.state.regions, regionId)
            ? this.state.regions[regionId]
            : null;
    }

    buildReportData() {
        const sets = ['A', 'B', 'C', 'D'].slice(0, this.state.numSets);
        const regionDefs = this.getRegionDefinitions(this.state.numSets);
        const problemText = document.getElementById('problem-text');

        return {
            timestamp: new Date(),
            numSets: this.state.numSets,
            universeSize: this.state.universeSize,
            currentSum: parseInt(this.currentSumEl.textContent, 10) || 0,
            remaining: parseInt(this.remainingEl.textContent, 10) || 0,
            status: this.statusText.textContent,
            problemRaw: problemText ? problemText.innerText.trim() : '',
            svgMarkup: this.svg ? this.svg.outerHTML : '',
            setRows: sets.map(setChar => ({
                setChar,
                current: this.getSetSum(setChar),
                target: this.state.setCardinalityTargets[setChar],
            })),
            regionRows: regionDefs.map(def => ({
                id: def.id,
                label: def.label,
                value: this.getRegionDisplayValue(def.id),
                target: this.state.regionCardinalityTargets[def.id],
            })),
            outsideValue: this.getRegionDisplayValue('outside'),
        };
    }

    renderReportHtml(data) {
        const escapeHTML = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const formatValue = (value) => (value === null || value === undefined ? '-' : escapeHTML(value));
        const problemBlock = data.problemRaw
            ? escapeHTML(data.problemRaw).replace(/\n/g, '<br>')
            : 'Sin problema generado.';

        const setRows = data.setRows.map(row => `
            <tr>
                <td>${escapeHTML(row.setChar)}</td>
                <td>${formatValue(row.current)}</td>
                <td>${formatValue(row.target)}</td>
            </tr>
        `).join('');

        const regionRows = data.regionRows.map(row => `
            <tr>
                <td>${escapeHTML(row.label)}</td>
                <td>${formatValue(row.value)}</td>
                <td>${formatValue(row.target)}</td>
            </tr>
        `).join('');

        const outsideRow = `
            <tr>
                <td>Fuera de los conjuntos</td>
                <td>${formatValue(data.outsideValue)}</td>
                <td>-</td>
            </tr>
        `;

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Informe de Conjuntos</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: "Outfit", "Segoe UI", Arial, sans-serif;
            color: #0f172a;
            margin: 32px;
        }
        h1 {
            margin: 0 0 8px;
            font-size: 26px;
        }
        .meta {
            font-size: 13px;
            color: #475569;
            margin-bottom: 24px;
        }
        .section {
            margin-bottom: 24px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
        }
        .summary-card {
            padding: 12px 14px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
        }
        .summary-card span {
            display: block;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 4px;
        }
        .summary-card strong {
            font-size: 16px;
        }
        .diagram {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            background: #ffffff;
        }
        .diagram svg {
            width: 100%;
            height: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th, td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        th {
            background: #f1f5f9;
            font-weight: 600;
        }
        .problem {
            padding: 12px 14px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 13px;
            line-height: 1.5;
        }
        @media print {
            body { margin: 20px; }
        }
    </style>
</head>
<body>
    <h1>Informe de resultados</h1>
    <div class="meta">
        Fecha y hora: ${escapeHTML(data.timestamp.toLocaleString('es-ES'))}
    </div>

    <div class="section summary">
        <div class="summary-card">
            <span>Conjuntos</span>
            <strong>${escapeHTML(data.numSets)}</strong>
        </div>
        <div class="summary-card">
            <span>Cardinalidad del universo</span>
            <strong>${escapeHTML(data.universeSize)}</strong>
        </div>
        <div class="summary-card">
            <span>Suma actual</span>
            <strong>${escapeHTML(data.currentSum)}</strong>
        </div>
        <div class="summary-card">
            <span>Restante</span>
            <strong>${escapeHTML(data.remaining)}</strong>
        </div>
        <div class="summary-card">
            <span>Estado</span>
            <strong>${escapeHTML(data.status)}</strong>
        </div>
    </div>

    <div class="section diagram">
        ${data.svgMarkup}
    </div>

    <div class="section">
        <h2>Cardinalidades por conjunto</h2>
        <table>
            <thead>
                <tr>
                    <th>Conjunto</th>
                    <th>Actual</th>
                    <th>Objetivo</th>
                </tr>
            </thead>
            <tbody>
                ${setRows}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Cardinalidades por region</h2>
        <table>
            <thead>
                <tr>
                    <th>Region</th>
                    <th>Actual</th>
                    <th>Objetivo</th>
                </tr>
            </thead>
            <tbody>
                ${regionRows}
                ${outsideRow}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Problema generado</h2>
        <div class="problem">${problemBlock}</div>
    </div>
</body>
</html>
        `;
    }

    generateReport() {
        const data = this.buildReportData();
        const reportWindow = window.open('', '_blank', 'width=980,height=720');

        if (!reportWindow) {
            alert('No se pudo abrir la ventana del informe. Habilita las ventanas emergentes.');
            return;
        }

        reportWindow.document.open();
        reportWindow.document.write(this.renderReportHtml(data));
        reportWindow.document.close();

        reportWindow.onload = () => {
            reportWindow.focus();
            reportWindow.print();
            reportWindow.onafterprint = () => {
                reportWindow.close();
            };
        };
    }
}

class ProblemGenerator {
    generate(numSets, universeSize) {
        // 1. Generate random distribution summing to universeSize
        // Regions depend on numSets
        let regions = [];
        if (numSets === 1) regions = ['A', 'outside'];
        else if (numSets === 2) regions = ['A_only', 'B_only', 'AB', 'outside'];
        else if (numSets === 3) regions = ['A_only', 'B_only', 'C_only', 'AB', 'BC', 'AC', 'ABC', 'outside'];
        else if (numSets === 4) regions = ['A_only', 'B_only', 'C_only', 'D_only', 'AB', 'BC', 'CD', 'AD', 'AC', 'BD', 'ABC', 'BCD', 'ACD', 'ABD', 'ABCD', 'outside']; // simplified 4-set logical regions for generation

        // Distribute algorithm
        let remaining = universeSize;
        const solution = {};

        // Random weights
        const weights = regions.map(() => Math.random());
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        let currentSum = 0;
        regions.forEach((r, i) => {
            if (i === regions.length - 1) {
                solution[r] = remaining; // Dump rest in last (outside)
            } else {
                const val = Math.floor((weights[i] / totalWeight) * universeSize);
                solution[r] = val;
                remaining -= val;
            }
        });

        // 2. Generate Problem Text
        let text = `<strong>Datos del problema:</strong><br>`;
        text += `Card. Universal $|U| = ${universeSize}$<br>`;

        // Helper to sum regions for a set
        const getSetSum = (setChar) => {
            // Sum all regions containing char but not others? No, standard definition n(A)
            return Object.keys(solution).reduce((sum, key) => {
                // Key mapping logic. 
                // key 'A_only' implies in A. 'AB' implies in A. 'outside' no.
                // Simple check: does key contain setChar?
                // Exception: 'outside' contains 's' etc. better be careful.
                // My keys: A_only, AB, ABC...
                if (key === 'outside') return sum;

                // For 'A_only', 'B_only' -> standardized to just checking formatted region names?
                // Logic: 
                // A_only -> A
                // AB -> A, B
                // ABC -> A, B, C

                // Handle 1 set case: 'A' -> A.
                if (key === 'A') return key.includes(setChar) ? sum + solution[key] : sum;

                // Handle others
                // Check if the setChar is in the key string. 
                // 'A_only' has 'A'. 'AB' has 'A'. 'B_only' does not.
                if (key.includes(setChar)) return sum + solution[key];
                return sum;
            }, 0);
        };

        // Generate n(A), n(B), etc.
        const sets = ['A', 'B', 'C', 'D'].slice(0, numSets);
        sets.forEach(s => {
            text += `$n(${s}) = ${getSetSum(s)}$<br>`;
        });

        // Intersections
        if (numSets >= 2) {
            text += `$n(A \\cap B) = ${this.getIntersectionSum(solution, 'A', 'B')}$<br>`;
        }
        if (numSets >= 3) {
            text += `$n(B \\cap C) = ${this.getIntersectionSum(solution, 'B', 'C')}$<br>`;
            text += `$n(A \\cap C) = ${this.getIntersectionSum(solution, 'A', 'C')}$<br>`;
            text += `$n(A \\cap B \\cap C) = ${this.getIntersectionSum(solution, 'A', 'B', 'C')}$<br>`;
        }

        // Maybe some random other clues? n(A U B)' ?
        // For now, standard intersections are enough to solve uniquely usually.

        return { solution, text };
    }

    getIntersectionSum(solution, ...sets) {
        return Object.keys(solution).reduce((sum, key) => {
            if (key === 'outside') return sum;
            // For 1 set case 'A'
            if (key === 'A') return sets.every(s => key.includes(s)) ? sum + solution[key] : sum;

            // For standard keys like AB, ABC, A_only
            // Check if key contains ALL chars in sets
            const matches = sets.every(s => key.includes(s));
            return matches ? sum + solution[key] : sum;
        }, 0);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VennApp();
});
