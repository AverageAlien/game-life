"use strict"
let Canvas = document.getElementById("main-canvas");
let Ctx = Canvas.getContext('2d');
Canvas.focus();
Canvas.oncontextmenu = () => false;

let OutputStats = document.getElementById("p-stats");
function WriteStats(Gen, Pop, Del) {
    OutputStats.innerHTML = `Generation: ${Gen} | Population: ${Pop} | Delta: ${Del}`;
}
let NumDelay = document.getElementById("num-delay");
let NumSteps = document.getElementById("num-steps");

// MATH extension
Math.clamp = function(num, min, max) {
    return(Math.max(min, Math.min(num, max)));
}

// RENDER

const CanvasData = {
    BgColor: "#000000",
    Width: 1024,
    Height: 512,
    Framerate: 60
};
CanvasData.Ratio = CanvasData.Width / CanvasData.Height;
const GridData = {
    Height: 32,
    Width: 64,
    Outline: 1,
    OutlineColor: "#303030"
}
const BlockColors = {
    Alive: "#ffffff",
    Dead: "#404040"
}

Ctx.fillStyle = CanvasData.BgColor;
Ctx.fillRect(0, 0, CanvasData.Width, CanvasData.Height);

function DrawRect(x, y, Color) {
    if (GridData.Outline > 0) {
        Ctx.fillStyle = GridData.OutlineColor;
    } else {
        Ctx.fillStyle = Color;
    }
    let W = CanvasData.Width / GridData.Width;
    let H = CanvasData.Height / GridData.Height;
    Ctx.fillRect(x, y, W, H);
    if (GridData.Outline > 0) {
        Ctx.fillStyle = Color;
        Ctx.fillRect(
            Math.clamp(x + GridData.Outline, x, x + W / 2),
            Math.clamp(y + GridData.Outline, y, y + H / 2),
            Math.clamp(W - GridData.Outline * 2, 0, W),
            Math.clamp(H - GridData.Outline * 2, 0, H)
        );
    }
}

function RenderFrame(RenderField) {
    Ctx.fillStyle = CanvasData.BgColor;
    Ctx.fillRect(0, 0, CanvasData.Width, CanvasData.Height);

    for (let i = 0; i < GridData.Width; ++i) {
        for (let j = 0; j < GridData.Height; ++j) {
            DrawRect(i * CanvasData.Width / GridData.Width,
                j * CanvasData.Height / GridData.Height, 
                RenderField[i][j]?(BlockColors.Alive):(BlockColors.Dead));
        }
    }
}


// GAMEPLAY

let Generation = 1;
const Rules = { // number of neighbours to stay alive / revive
    Alive: [2, 3],
    Dead: [3]
};
let OldPopulation = 0;
let Delta = 0;
let Playing = false;
let PlayLoop = null;

function CreateField(Width, Height, SampleField = null) {
    let F = new Array(Width);
    for (let i = 0; i < Width; ++i) {
        F[i] = new Array(Height).fill(false);
    }
    if (SampleField) {
        for (let i = 0; i < GridData.Width; ++i) {
            for (let j = 0; j < GridData.Height; ++j) {
                if (SampleField[i][j]) { // cell alive
                    if (Rules.Alive.indexOf(CountNeighbours(SampleField, i, j)) >= 0) {
                        F[i][j] = true; // stay alive
                    }
                } else { // cell dead
                    if (Rules.Dead.indexOf(CountNeighbours(SampleField, i, j)) >= 0) {
                        F[i][j] = true; // revive cell
                    }
                }
            }
        }
    }
    return F;
}
let Field = CreateField(GridData.Width, GridData.Height);
RenderFrame(Field);

function CountNeighbours(F, x, y) {
    let Neighbours = 0;
    let XL = (x > 0);
    let XG = (x < GridData.Width - 1);
    let YL = (y > 0);
    let YG = (y < GridData.Height - 1)
    if (XL && F[x-1][y]) ++Neighbours;
    if (YL && F[x][y-1]) ++Neighbours;
    if (XG && F[x+1][y]) ++Neighbours;
    if (YG && F[x][y+1]) ++Neighbours;

    if (XL && YL && F[x-1][y-1]) ++Neighbours;
    if (XL && YG && F[x-1][y+1]) ++Neighbours;
    if (XG && YL && F[x+1][y-1]) ++Neighbours;
    if (XG && YG && F[x+1][y+1]) ++Neighbours;

    return Neighbours;
}

function CountPopulation(F) {
    let Population = 0;
    for (let i = 0; i < GridData.Width; ++i) {
        for (let j = 0; j < GridData.Height; ++j) {
            if (F[i][j]) ++Population;
        }
    }
    return Population;
}


// INPUT
let Drawing = false;
let Deleting = false;

function DrawMouse(x, y, Life) {
    let Click = {
        X: x,
        Y: y
    }
    Click.X = Math.floor(Click.X / CanvasData.Width * GridData.Width);
    Click.Y = Math.floor(Click.Y / CanvasData.Height * GridData.Height);
    if (Click.X >= 0 && Click.X < GridData.Width &&
        Click.Y >= 0 && Click.Y < GridData.Width) {
        if (Field[Click.X][Click.Y] != Life) {
            Field[Click.X][Click.Y] = Life;
            Life?(++OldPopulation):(--OldPopulation);
            Life?(++Delta):(--Delta);
            WriteStats(Generation, OldPopulation, Delta);
            RenderFrame(Field);
        }
    }
}


Canvas.addEventListener("mousedown", function(event) {
    if (event.button == 0) { // draw life
        Drawing = true;
        let Rect = Canvas.getBoundingClientRect();
        DrawMouse(event.clientX - Rect.left, event.clientY - Rect.top, true);
    } else if (event.button == 2) { // draw death
        Deleting = true;
        let Rect = Canvas.getBoundingClientRect();
        DrawMouse(event.clientX - Rect.left, event.clientY - Rect.top, false);
    }
});

Canvas.addEventListener("mousemove", function(event) {
    if (Drawing) {
        let Rect = Canvas.getBoundingClientRect();
        DrawMouse(event.clientX - Rect.left, event.clientY - Rect.top, true);
    } else if (Deleting) {
        let Rect = Canvas.getBoundingClientRect();
        DrawMouse(event.clientX - Rect.left, event.clientY - Rect.top, false);
    }
});

Canvas.addEventListener("mouseup", function(event) {
    if (event.button == 0) {
        Drawing = false;
    } else if (event.button == 2) {
        Deleting = false;
    }
});

Canvas.addEventListener("mouseleave", function(event) {
    if (event.target == Canvas) {
        Drawing = false;
        Deleting = false;
    }
});

// UI BUTTON FUNCTIONS

function ClearField() {
    StopIteration();
    Field = CreateField(GridData.Width, GridData.Height);
    Generation = 1;
    OldPopulation = 0;
    Delta = 0;
    WriteStats(Generation, OldPopulation, Delta);
    RenderFrame(Field);
}

function Iterate() {
    let NewField = CreateField(GridData.Width, GridData.Height, Field);
    let NewPopulation = CountPopulation(NewField);
    Delta = NewPopulation - OldPopulation;
    ++Generation;
    WriteStats(Generation, NewPopulation, Delta);
    RenderFrame(NewField);
    OldPopulation = NewPopulation;
    Field = NewField;
}

function LoopIteration() {
    if (Playing) return;
    Playing = true;
    let Delay = NumDelay.value;
    PlayLoop = setInterval(Iterate, Delay);
}

function StopIteration() {
    if (!Playing) return;
    Playing = false;
    clearInterval(PlayLoop);
}

function SkipSteps() {
    let Steps = NumSteps.value;
    for (let i = 0; i < Steps; ++i) {
        Iterate();
    }
}

function Export() {
    let AliveList = [];
    for (let i = 0; i < GridData.Width; ++i) {
        for (let j = 0; j < GridData.Height; ++j) {
            if (Field[i][j]) {
                AliveList.push({
                    X: i,
                    Y: j
                });
            }
        }
    }
    let StringExport = JSON.stringify(AliveList);
    alert("Copy the string below:\n" + StringExport);
}

function Import() {
    let StringImport = prompt("Please paste JSON string of the cell map here.");
    let AliveList;
    try {
        AliveList = JSON.parse(StringImport);
    } catch (e) {
        alert("Failed to parse JSON string. " + e);
        return;
    }
    ClearField();
    try {
        AliveList.forEach(function(P) {
            Field[P.X][P.Y] = true;
        });
    } catch (e) {
        alert("Parsed JSON list has invalid structure. " + e);
        return;
    }
    OldPopulation = CountPopulation(Field);
    WriteStats(Generation, OldPopulation, Delta);
    RenderFrame(Field);
}