import { IInputs, IOutputs } from "./generated/ManifestTypes";
import "./CSS/TimePickerControl.css";

export class TimePickerControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private notifyOutputChanged: () => void;
    private selectedHour = 7;
    private selectedMinute = 0;
    private isPM = false;
    private timeValue = "07:00 AM";

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.container = container;
        this.notifyOutputChanged = notifyOutputChanged;
        this.timeValue = context.parameters.TimeValue.raw || "07:00 AM";

        this.parseTimeValue();
        this.renderControl();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const newTimeValue = context.parameters.TimeValue.raw || "07:00 AM";
        if (this.timeValue !== newTimeValue) {
            this.timeValue = newTimeValue;
            this.parseTimeValue();
            this.refreshUI();
        }
    }

    private parseTimeValue(): void {
        const match = this.timeValue.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
        if (match) {
            this.selectedHour = parseInt(match[1], 10) || 7;
            this.selectedMinute = parseInt(match[2], 10) || 0;
            this.isPM = match[3] === "PM";
        }
    }

    private renderControl(): void {
        this.container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.classList.add("time-picker-wrapper");

        wrapper.appendChild(this.createTimeInputSection());
        wrapper.appendChild(this.createClockSection());
        wrapper.appendChild(this.createFooterButtons());

        this.container.appendChild(wrapper);
    }

    private createTimeInputSection(): HTMLDivElement {
        const timeInputContainer = document.createElement("div");
        timeInputContainer.classList.add("time-input-container");

        const timeDisplay = document.createElement("div");
        timeDisplay.classList.add("time-display");

        const hourSpan = this.createEditableSpan(this.formatHour(this.selectedHour), (value) => {
            this.selectedHour = this.clamp(parseInt(value, 10), 1, 12);
            this.updateTimeValue();
        });

        const minuteSpan = this.createEditableSpan(this.formatMinute(this.selectedMinute), (value) => {
            this.selectedMinute = this.clamp(parseInt(value, 10), 0, 59);
            this.updateTimeValue();
        });

        timeDisplay.appendChild(hourSpan);
        timeDisplay.appendChild(document.createTextNode(" : "));
        timeDisplay.appendChild(minuteSpan);

        const amPmContainer = document.createElement("div");
        amPmContainer.classList.add("ampm-toggle-container");

        const amButton = this.createToggleButton("AM", !this.isPM, () => this.toggleAMPM(false));
        const pmButton = this.createToggleButton("PM", this.isPM, () => this.toggleAMPM(true));

        amPmContainer.appendChild(amButton);
        amPmContainer.appendChild(pmButton);
        timeInputContainer.appendChild(timeDisplay);
        timeInputContainer.appendChild(amPmContainer);

        return timeInputContainer;
    }

    private createEditableSpan(value: string, onChange: (value: string) => void): HTMLSpanElement {
        const span = document.createElement("span");
        span.contentEditable = "true";
        span.innerText = value;
        span.classList.add("editable-time");

        span.addEventListener("blur", () => {
            onChange(span.innerText);
            this.refreshUI();
        });

        span.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                span.blur();
            }
        });

        return span;
    }

    private createClockSection(): HTMLDivElement {
        const clockFace = document.createElement("div");
        clockFace.classList.add("clock-face");

        const clockHand = document.createElement("div");
        clockHand.classList.add("clock-hand");
        clockHand.style.transform = `rotate(${this.selectedHour * 30}deg)`;
        clockFace.appendChild(clockHand);

        for (let i = 1; i <= 12; i++) {
            const hourBtn = this.createHourButton(i, clockHand);
            clockFace.appendChild(hourBtn);
        }

        return clockFace;
    }

    private createFooterButtons(): HTMLDivElement {
        const footer = document.createElement("div");
        footer.classList.add("footer-buttons");

        const cancelButton = this.createButton("CANCEL", () => this.resetToDefault());
        cancelButton.classList.add("cancel-button");

        const okButton = this.createButton("OK", () => alert(`Selected Time: ${this.timeValue}`));
        okButton.classList.add("ok-button");

        footer.appendChild(cancelButton);
        footer.appendChild(okButton);
        return footer;
    }

    private createToggleButton(label: string, isActive: boolean, onClick: () => void): HTMLButtonElement {
        const button = document.createElement("button");
        button.innerText = label;
        button.classList.add("ampm-toggle");

        if (isActive) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            onClick();
            this.refreshUI();
        });

        return button;
    }

    private createButton(label: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement("button");
        button.innerText = label;
        button.addEventListener("click", onClick);
        return button;
    }

    private createHourButton(hour: number, clockHand: HTMLElement): HTMLDivElement {
        const hourBtn = document.createElement("div");
        hourBtn.innerText = hour.toString();
        hourBtn.classList.add("hour-button");
        if (hour === this.selectedHour) {
            hourBtn.classList.add("selected");
        }

        const angle = (hour - 3) * 30;
        const x = Math.cos((angle * Math.PI) / 180) * 70;
        const y = Math.sin((angle * Math.PI) / 180) * 70;
        hourBtn.style.transform = `translate(${x}px, ${y}px)`;

        hourBtn.addEventListener("click", () => {
            this.selectedHour = hour;
            this.updateTimeValue();
            clockHand.style.transform = `rotate(${this.selectedHour * 30}deg)`;
            this.refreshUI();
        });

        return hourBtn;
    }

    private toggleAMPM(isPM: boolean): void {
        this.isPM = isPM;
        this.updateTimeValue();
    }

    private updateTimeValue(): void {
        this.timeValue = `${this.formatHour(this.selectedHour)}:${this.formatMinute(this.selectedMinute)} ${this.isPM ? "PM" : "AM"}`;
        this.notifyOutputChanged();
    }

    private refreshUI(): void {
        this.renderControl();
    }

    private resetToDefault(): void {
        this.selectedHour = 7;
        this.selectedMinute = 0;
        this.isPM = false;
        this.timeValue = "07:00 AM";
        this.refreshUI();
    }

    private formatHour(hour: number): string {
        return hour < 10 ? `0${hour}` : `${hour}`;
    }

    private formatMinute(minute: number): string {
        return minute < 10 ? `0${minute}` : `${minute}`;
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    public getOutputs(): IOutputs {
        return { TimeValue: this.timeValue };
    }

    public destroy(): void {
        this.container.innerHTML = "";
    }
}
