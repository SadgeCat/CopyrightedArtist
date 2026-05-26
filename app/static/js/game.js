document.addEventListener('DOMContentLoaded', () => {
    const drawingPhase = document.getElementById('drawing-phase');
    const votingPhase = document.getElementById('voting-phase');
    const socket = io();
    // socket.emit('join_game', { game_id: GAME_ID });
    const phases = {
        drawing: document.getElementById("drawing-phase"),
        copying: document.getElementById("copying-phase"),
        voting: document.getElementById("voting-phase")
    };

    socket.emit("join_game", {
        "game_id": GAME_ID
    });
    socket.emit("sync_game", {
        "game_id": GAME_ID
    });
    socket.on("restore_game", (data) => {
        switchPhase(data.phase);
        if(data.phase === "copying"){
            to_copy = data.to_copy;
            if(data.copy_state === "memorizing"){
                memorizingPhase(data.time_left);
            } else if(data.copy_state === "drawing"){
                copyingPhase(data.time_left);
            }
        } else{
            startTimer(data.time_left, data.phase, true);
        }
    })

    function switchPhase(newPhase) {
        Object.values(phases).forEach(phase => {
            phase.classList.remove("active-phase");
        })
        phases[newPhase].classList.add("active-phase");

        const drawingTool = document.getElementById("drawing-tool");
        if(newPhase === "drawing" || newPhase === "copying"){
            drawingTool.style.display = "flex";
        } else{
            drawingTool.style.display = "none";
        }

        curPhase = newPhase;
    }
    let curPhase = PHASE;
    switchPhase(curPhase);

    function createCanvas(canvasID){
        const canvas = document.getElementById(canvasID);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const colorPicker = document.getElementById('color-picker');
        const brushSize = document.getElementById('brush-size');


        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }


        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getMousePos(e);
            lastX = pos.x;
            lastY = pos.y;
            draw(e);
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            ctx.beginPath();
        });

        canvas.addEventListener('mouseout', () => {
            isDrawing = false;
            ctx.beginPath();
        });


        canvas.addEventListener('mousemove', draw);

        function draw(e) {
            if (!isDrawing) return;

            const pos = getMousePos(e);

            ctx.lineWidth = brushSize.value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = colorPicker.value;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastX = pos.x;
            lastY = pos.y;
        }

        return {canvas,ctx};
    }

    const drawingCanvas = createCanvas("drawing-canvas");
    const copyCanvas = createCanvas("copy-canvas");
    const clearDrawingBtn = document.getElementById('clear1-btn');
    const clearCopyBtn = document.getElementById('clear2-btn');
    const submitDrawingBtn = document.getElementById('submit-drawing-btn');
    const submitCopyBtn = document.getElementById('submit-copy-btn');

    let timerInterval = 0
    function startTimer(time, currentPhase, autoSubmit){
        clearInterval(timerInterval);
        let timeLeft = time;

        let timerElement = null;
        if(currentPhase === "drawing") timerElement = document.getElementById('drawing-timer');
        else if(currentPhase === "copying") timerElement = document.getElementById('copy-timer');
        else if(currentPhase === "voting") timerElement = document.getElementById('voting-timer');
        timerElement.textContent = timeLeft;

        timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if(autoSubmit){
                    if(currentPhase === "drawing") submitDrawingBtn.click();
                    else if(currentPhase === "copying") submitCopyBtn.click();
                    else if(currentPhase === "voting") submitVoteBtn.click();
                }
            }
        }, 1000);
    }
    startTimer(timer, curPhase, true);

    clearDrawingBtn.addEventListener('click', () => {
            const canvas = drawingCanvas.canvas;
            const ctx = drawingCanvas.ctx;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

    clearCopyBtn.addEventListener('click', () => {
            const canvas = copyCanvas.canvas;
            const ctx = copyCanvas.ctx;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

    submitDrawingBtn.addEventListener('click', () => {
        const dataUrl = drawingCanvas.canvas.toDataURL('image/png');

        // drawingPhase.classList.remove('active-phase');
        // votingPhase.classList.add('active-phase');
        
        socket.emit("submit_original", {
            "game_id": GAME_ID,
            "username": USERNAME,
            "prompt": PROMPT,
            "image": dataUrl
        })

        submitDrawingBtn.disabled = true;
        submitDrawingBtn.textContent = "waiting for other players...";
        
        // const refImg = document.getElementById("reference-image");
        // refImg.src = dataUrl;
        // socket.emit("image", {'game_id': GAME_ID, 'prompt': PROMPT, 'username': USERNAME , 'image': dataUrl})
        // const img1 = document.getElementById('drawing-img-1');
        // if (img1) {
        //     img1.src = dataUrl;
        //     img1.style.backgroundColor = '#ffffff';
        // }

       //  switchPhase("copying");

    });
    
    let to_copy = [];
    let copied_images = {};
    let copy_index = 0;
    
    socket.on("start_copying", (data) => {
        console.log("received start_copying");
        to_copy = data.to_copy;
        switchPhase("copying");
        getCopyTask(10);
        // startTimer(60, curPhase);
    })

    socket.on("start_copy_real", () => {
        copyingPhase(60);
    })

    function memorizingPhase(timeLeft){
        const task = to_copy[copy_index];
        const refImg = document.getElementById("reference-image");
        const canvas = copyCanvas.canvas;
        const ctx = copyCanvas.ctx;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        refImg.src = task.image;
        refImg.style.display = "block";

        // 10 sec timer for memorizing then copying
        canvas.style.pointerEvents = "none";
        startTimer(timeLeft, "copying", false);
        
        if(copy_index > 0){
            setTimeout(() => {
                console.log("memorizing 2nd image done");
            }, 10000)
            copyingPhase(60);
        }
    }

    function copyingPhase(timeLeft){
        const refImg = document.getElementById("reference-image");
        const canvas = copyCanvas.canvas;
        refImg.style.display = "none";
        canvas.style.pointerEvents = "auto";
        startTimer(timeLeft, "copying", true);
    }

    function getCopyTask(timeLeft){
        memorizingPhase(timeLeft);
    }

    submitCopyBtn.addEventListener('click', () => {

        const copyUrl = copyCanvas.canvas.toDataURL('image/png');
        const task = to_copy[copy_index];

        // currently hardcoded to img2 but should change later
        // const img2 = document.getElementById('drawing-img-2');
        // if (img2) {
        //     img2.src = copyUrl;
        //     img2.style.backgroundColor = '#ffffff';
        // }
        
        socket.emit("submit_copy", {
            "game_id": GAME_ID,
            "username": USERNAME,
            "task": task,
            "image": copyUrl
        })

        copy_index++;
        if(copy_index < to_copy.length){
            getCopyTask(10);
        } else{
            submitCopyBtn.disabled = true;
            submitCopyBtn.textContent = "waiting for other players...";
        }

        // switchPhase("voting");
    })

    let voting_set = []

    socket.on("start_voting", (data) => {
        console.log("received start_voting");
        voting_set = data.voting_set;
        switchPhase("voting");
        startTimer(30, curPhase, true);
    })

    // adjust this later

    let selectedVoteId = null;

    window.selectVote = function (id) {
        selectedVoteId = id;
        const cards = document.querySelectorAll('.drawing-card');
        cards.forEach(card => {
            card.style.borderColor = '#ccc';
            card.style.backgroundColor = '#fff';
            card.style.transform = 'none';
            card.style.boxShadow = 'none';
        });

        const selectedCard = document.getElementById(`card-${id}`);
        if (selectedCard) {
            selectedCard.style.borderColor = '#007bff';
            selectedCard.style.backgroundColor = '#eef6ff';
            selectedCard.style.transform = 'translateY(-5px)';
            selectedCard.style.boxShadow = '0 5px 15px rgba(0,123,255,0.3)';
        }

        const submitVoteBtn = document.getElementById('submit-vote-btn');
        if (submitVoteBtn) {
            submitVoteBtn.disabled = false;
        }
    };

    const submitVoteBtn = document.getElementById('submit-vote-btn');
    if (submitVoteBtn) {
        submitVoteBtn.addEventListener('click', () => {
            if (selectedVoteId) {
                alert(`Vote submitted for Option ${selectedVoteId}! Waiting for other players...`);
                submitVoteBtn.disabled = true;
                submitVoteBtn.textContent = "Vote Recorded";
            }
        });
    }

    // const drawingTimer = document.getElementById('drawing-timer');
    // if (drawingTimer) {
    //     let timeLeft = timer;
    //     const timerInterval = setInterval(() => {
    //         timeLeft--;
    //         drawingTimer.textContent = timeLeft;
    //         if (timeLeft <= 0) {
    //             clearInterval(timerInterval);
    //             if (drawingCanvas.canvas && phases["drawing"].classList.contains('active-phase')) {
    //                 document.getElementById('submit-drawing-btn').click();
    //             }
    //         }
    //     }, 1000);
    // }
    // const copyTimer = document.getElementById('copy-timer');
    // if (copyTimer) {
    //     let timeLeft = 60;
    //     const timerInterval = setInterval(() => {
    //         timeLeft--;
    //         copyTimer.textContent = timeLeft;
    //         if (timeLeft <= 0) {
    //             clearInterval(timerInterval);
    //             if (copyCanvas.canvas && phases["copying"].classList.contains('active-phase')) {
    //                 document.getElementById('submit-copy-btn').click();
    //             }
    //         }
    //     }, 1000);
    // }
});
