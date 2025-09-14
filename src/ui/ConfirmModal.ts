import type { App } from 'obsidian';
import { ButtonComponent, Modal } from 'obsidian';

interface ConfirmOptions {
    app: App;
    cancelButtonText?: string;
    cssClass?: string;
    message: DocumentFragment | string;
    okButtonText?: string;
    title?: DocumentFragment | string;
}

type PromiseResolve<T> = undefined extends T ? (value?: PromiseLike<T> | T) => void
    : (value: PromiseLike<T> | T) => void;

class ConfirmModal extends Modal {
    private isConfirmed = false;
    private options: Required<ConfirmOptions>;

    public constructor(options: ConfirmOptions, private readonly resolve: PromiseResolve<boolean>) {
        super(options.app);
        const DEFAULT_OPTIONS: Required<ConfirmOptions> = {
            app: options.app,
            cancelButtonText: 'Cancel',
            cssClass: '',
            message: options.message,
            okButtonText: 'OK',
            title: ''
        };
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.containerEl.addClass('confirm-modal');
    }

    public override onClose(): void {
        super.onClose();
        this.resolve(this.isConfirmed);
    }

    public override onOpen(): void {
        super.onOpen();
        this.titleEl.setText(this.options.title);
        this.contentEl.createEl('p', { text: this.options.message });
        const okButton = new ButtonComponent(this.contentEl);
        okButton.setClass('ok-button');
        okButton.setButtonText(this.options.okButtonText);
        okButton.setCta();
        okButton.onClick(() => {
            this.isConfirmed = true;
            this.close();
        });

        const cancelButton = new ButtonComponent(this.contentEl);
        cancelButton.setButtonText(this.options.cancelButtonText);
        cancelButton.onClick(this.close.bind(this));
    }
}

export async function confirm(options: ConfirmOptions): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
        const modal = new ConfirmModal(options, resolve);
        modal.open();
    });
}
