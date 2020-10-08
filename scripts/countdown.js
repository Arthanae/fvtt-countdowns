const CountdownInterval = function (fn, interval, ...params) {
    this.id = setInterval(fn, interval, this, ...params);

    this.clear = function() {
        clearInterval(this.id);
    }
}

class Countdown {

    constructor() {
        console.log('Countdown Timers | Loaded into FoundryVTT');
    }

    createButton() {
        this.cdButton = {
            name: "cd",
            icon: "fas fa-clock",
            layer: "GridLayer",
            title: "Countdown Timers",
            tools: [
                {
                    icon: "fas fa-clock",
                    name: "createCd",
                    title: "Create Countdown Timer as Chat message",
                    onClick: cdTool.cdButtonHandler
                }
            ]
        }
    }

    _addCountdownButton(controls) {
        controls.push(cdTool.cdButton);
    }

    __formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;
        if(seconds < 10) {
            seconds = `0${seconds}`;
        }

        return `${minutes}:${seconds}`
    }

    async cdButtonHandler() {
        const templatePath = 'modules/countdown/templates/countdown-window.html';
        const html = await renderTemplate(templatePath, null);
        new Dialog({
            title: "Set Grid",
            content: html,
            buttons: {
                create: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Create Countdown",
                    callback: cb => {
                        const form = cb.find('#compendium-create'),
                        data = validateForm(form[0]);
                        data.cdId = Date.now();
                        data.timeLeft = cdTool.__formatTime(data.cdLength);
                        data.elapsed = 0;
                        cdTool.createCountdownChat(data);
                    }
                }
            }
        }).render(true);
    }

    async createCountdownChat(data) {
        const chatTemplatePath = 'modules/countdown/templates/countdown-chat.html';
        const html = await renderTemplate(chatTemplatePath, data);
        let message = await ChatMessage.create({content: html})
        const timerInterval = new CountdownInterval(this.createTimerInterval, 1000, data, message.data._id);
        //setTimeout(timerInterval.clear.bind(timerInterval), data.cdLength * 1000);
    }

    async createTimerInterval(interval, data, messageId) {
        const chatTemplatePath = 'modules/countdown/templates/countdown-chat.html';
        data.elapsed += 1;
        data.timeLeft = cdTool.__formatTime(data.cdLength - data.elapsed);
        const html = await renderTemplate(chatTemplatePath, data);
        ChatMessage.update({_id: messageId, content: html})
        if ((data.cdLength - data.elapsed) <= 0) {
            interval.clear();
        }
    }
}

let cdTool = new Countdown()

cdTool.createButton();

Hooks.on("getSceneControlButtons", controls => {
    cdTool._addCountdownButton(controls)
});