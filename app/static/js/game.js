document.addEventListener('DOMContentLoaded', () => {
    document.body.style.visibility = "hidden";
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
            copy_index = data.copy_index
            if(data.copy_state === "memorizing"){
                memorizingPhase(data.time_left);
            } else if(data.copy_state === "drawing"){
                copyingPhase(data.time_left);
            } else if(data.copy_state == "finished"){
                submitCopyBtn.disabled = true;
                submitCopyBtn.textContent = "waiting for other players...";
            }
        } else{
            startTimer(data.time_left, data.phase, true);
        }
        document.body.style.visibility = "visible";
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
    const submitVoteBtn = document.getElementById('submit-vote-btn');

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
        
        // if(copy_index > 0){
        //     setTimeout(() => {
        //         console.log("memorizing 2nd image done");
        //         copyingPhase(60);
        //     }, 10000)
        // }
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

    let voting_set = [];
    let round_idx = 0;
    let selectedVoteId = null;

    socket.on("start_voting", (data) => {
        console.log("received start_voting");
        voting_set = data.voting_set;
        round_idx = data.round_idx
        switchPhase("voting");
        showVotingSet();
        startTimer(30, curPhase, true);
    });

    let canVoteThisRound = true;
    function showVotingSet(){
        const promptEle = document.getElementById('vote-prompt');
        const img1 = document.getElementById('drawing-img-1');
        const img2 = document.getElementById('drawing-img-2');
        const img3 = document.getElementById('drawing-img-3');
        promptEle.textContent = voting_set['prompt'];
        const drawings = voting_set['drawings'];
        img1.src = drawings[0]['image'];
        img2.src = drawings[1]['image'];
        img3.src = drawings[2]['image'];

        // reset selections
        selectedVoteId = null;
        const cards = document.querySelectorAll('.drawing-card');
        cards.forEach(card => {
            card.style.borderColor = '#ccc';
            card.style.backgroundColor = '#fff';
            card.style.transform = 'none';
            card.style.boxShadow = 'none';
            card.style.pointerEvents = "auto";
            card.style.opacity = "1";
            card.querySelectorAll(".vote-count").forEach(v => v.remove());
        });
        submitVoteBtn.disabled = true;

        // disable voting btn if user is original/copy
        canVoteThisRound = !voting_set['cant_vote'].includes(Number(USER_ID))
        if(!canVoteThisRound){
            submitVoteBtn.textContent = "you can't vote this round";
            cards.forEach(card => {
                card.style.pointerEvents = "none";
                card.style.opacity = "0.7";
            });
        } else{
            submitVoteBtn.textContent = "Submit Vote";
        }
    }

    // adjust this later

    window.selectVote = function (id) {
        if(!canVoteThisRound) return;
        selectedVoteId = id;
        const cards = document.querySelectorAll('.drawing-card');
        cards.forEach(card => {
            card.style.borderColor = '#ccc';
            card.style.backgroundColor = '#fff';
            card.style.transform = 'none';
            card.style.boxShadow = 'none';
            card.querySelectorAll(".vote-count").forEach(v => v.remove());
        });

        const selectedCard = document.getElementById(`card-${id}`);
        if (selectedCard) {
            selectedCard.style.borderColor = '#007bff';
            selectedCard.style.backgroundColor = '#eef6ff';
            selectedCard.style.transform = 'translateY(-5px)';
            selectedCard.style.boxShadow = '0 5px 15px rgba(0,123,255,0.3)';
        }

        if (submitVoteBtn) {
            submitVoteBtn.disabled = false;
        }
    };

    window.reportDrawing = function(cardNum) {
        // cardNum is 1-indexed; drawing index is 0-indexed
        const drawingIdx = cardNum - 1;
        const drawings = voting_set['drawings'];
        if (!drawings || drawingIdx >= drawings.length) return;

        // Disable all report buttons for this round to prevent spam
        [1, 2, 3].forEach(n => {
            const btn = document.getElementById(`report-btn-${n}`);
            if (btn) { btn.disabled = true; btn.textContent = '⚑ Reported'; }
        });

        socket.emit('report_drawing', {
            game_id: GAME_ID,
            round_idx: round_idx,
            drawing_idx: drawingIdx
        });
    };

    window.reportCopyTask = function() {
        if (!to_copy || copy_index >= to_copy.length) return;
        const task = to_copy[copy_index];
        
        const btn = document.getElementById('report-copy-btn');
        if (btn) { btn.disabled = true; btn.textContent = '⚑ Reported'; }

        socket.emit('report_drawing_copy_phase', {
            game_id: GAME_ID,
            target_id: task.target
        });
    };

    socket.on('game_ended', (data) => {
        alert(data.reason + '. The game has ended.');
        window.location.href = '/home';
    });

    socket.on('player_removed', (data) => {
        if (data.username === USERNAME) {
            alert("You have been removed from the game because your drawing was reported.");
            window.location.href = "/home";
            return;
        }

        // Show a non-blocking toast
        const toast = document.createElement('div');
        toast.textContent = `⚑ A player was removed for an inappropriate drawing.`;
        toast.style.cssText = [
            'position:fixed', 'bottom:28px', 'left:50%', 'transform:translateX(-50%)',
            'background:rgba(220,53,69,0.92)', 'color:#fff', 'padding:12px 24px',
            'border-radius:10px', 'font-weight:600', 'z-index:9999',
            'box-shadow:0 4px 18px rgba(0,0,0,0.4)', 'font-size:0.95rem',
            'pointer-events:none', 'transition:opacity 0.4s'
        ].join(';');
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
        setTimeout(() => toast.remove(), 3500);
    });

    submitVoteBtn.addEventListener('click', () => {
        if(selectedVoteId === null) return;
        socket.emit("submit_vote", {
            "game_id": GAME_ID,
            "username": USERNAME,
            "selected_idx": selectedVoteId
        })

        submitVoteBtn.disabled = true;
        submitVoteBtn.textContent = "waiting for other players to vote...";
    });

    socket.on("show_vote_results", (data) => {
        clearInterval(timerInterval);

        const cards = document.querySelectorAll('.drawing-card');
        cards.forEach((card, idx) => {
            if(idx === data.original_idx){
                card.style.borderColor = "green";
            }

            card.querySelectorAll(".vote-count").forEach(v => v.remove());

            const voteCntText = document.createElement("div");
            voteCntText.className = "vote-count";
            voteCntText.textContent = `${data.vote_cnt[idx]} votes`;
            voteCntText.style.color = "black";
            voteCntText.style.fontWeight = "bold";
            voteCntText.style.marginTop = "8px";
            card.appendChild(voteCntText);
        })

        let resultsTime = 6;
        const votingTimer = document.getElementById("voting-timer");
        votingTimer.textContent = `Next round in ${resultsTime}`;

        const x = setInterval(() => {
            resultsTime--;
            votingTimer.textContent = `Next round in ${resultsTime}`;
            if(resultsTime <= 0){
                clearInterval(x);
            }
        }, 1000);
    })

    // socket.on("vote_results", (data) => {
    //     const correctIdx = data.correct_idx;
    //     const results = data.results;

    //     const cards = document.querySelectorAll('.drawing-card');

    //     // reset all cards first
    //     cards.forEach(card => {
    //         card.style.borderColor = '#ccc';
    //         card.style.backgroundColor = '#fff';
    //     });

    //     // highlight correct drawing
    //     const correctCard = document.getElementById(`card-${correctIdx + 1}`);
    //     if (correctCard) {
    //         correctCard.style.borderColor = '#28a745';
    //         correctCard.style.backgroundColor = '#e9fbe9';
    //     }

    //     // highlight player's own choice
    //     if (selectedVoteId !== null) {
    //         const chosenCard = document.getElementById(`card-${selectedVoteId}`);

    //         // if wrong, make it red
    //         if ((selectedVoteId - 1) !== correctIdx) {
    //             chosenCard.style.borderColor = '#dc3545';
    //             chosenCard.style.backgroundColor = '#ffeaea';
    //         }
    //     }

    //     const resultsText = document.getElementById("vote-results-text");
    //     if (resultsText) {
    //         const correctPlayers = Object.entries(results).filter(([_, correct]) => correct).length;

    //         resultsText.textContent = `${correctPlayers}/${Object.keys(results).length} guessed correctly`;
    //     }

    //     setTimeout(() => {
    //         voting_idx++;

    //         if (voting_idx < voting_set.length) {
    //             selectedVoteId = null;

    //             submitVoteBtn.disabled = true;
    //             submitVoteBtn.textContent = "Submit Vote";

    //             showVotingSet();
    //             startTimer(30, "voting", true);
    //         } else {
    //             submitVoteBtn.disabled = true;
    //             submitVoteBtn.textContent = "Voting complete!";
    //         }
    //     }, 4000);
    // });

    // if (submitVoteBtn) {
    //     submitVoteBtn.addEventListener('click', () => {
    //         if (selectedVoteId) {
    //             alert(`Vote submitted for Option ${selectedVoteId}! Waiting for other players...`);
    //             submitVoteBtn.disabled = true;
    //             submitVoteBtn.textContent = "Vote Recorded";
    //         }
    //     });
    // }

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
