document.addEventListener('DOMContentLoaded', () => {
    const drawingPhase = document.getElementById('drawing-phase');
    const votingPhase = document.getElementById('voting-phase');


    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const colorPicker = document.getElementById('color-picker');
        const brushSize = document.getElementById('brush-size');
        const clearBtn = document.getElementById('clear-btn');
        const submitDrawingBtn = document.getElementById('submit-drawing-btn');


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

        clearBtn.addEventListener('click', () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        submitDrawingBtn.addEventListener('click', () => {
            const dataUrl = canvas.toDataURL('image/png');

            drawingPhase.classList.remove('active-phase');
            votingPhase.classList.add('active-phase');

            const img1 = document.getElementById('drawing-img-1');
            if (img1) {
                img1.src = dataUrl;
                img1.style.backgroundColor = '#ffffff';
            }

        });
    }

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

    const timerElement = document.getElementById('timer');
    if (timerElement) {
        let timeLeft = 60;
        const timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (canvas && drawingPhase.classList.contains('active-phase')) {
                    document.getElementById('submit-drawing-btn').click();
                }
            }
        }, 1000);
    }
});
