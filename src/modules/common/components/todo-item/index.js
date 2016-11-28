import App from "app/app";
import { Component, on } from "marionette.component";
import TodoModel from "./model";
import Template from "./index.html";
import * as Styles from "!css?modules!sass!./style.scss";

/**
 * Entry point for the todo item
 */
class TodoItem extends Component {

    /**
     * Setup our component.
     */
    constructor (elementName, {value}) {
        super(elementName);

        this.render(elementName, value);

        return this;
    }

    /**
     * Render method, we define the initial state here.
     *
     * @param elementName {String} The element name we've been designated.
     * @param value {String} The initial title we'll set.
     */
    render (elementName, value) {
        /** New model **/
        this.state = new TodoModel({
            title: value
        });

        const renderedTemplate = _.template(Template)(this.state.attributes);

        this.renderComponent(elementName, renderedTemplate, Styles, this.state);
        this.setupEventListeners();
    }

    /**
     * When the user clicks the checkbox, we want to toggle state.
     *
     * @param event {Event} The click event
     */
    @on("click input[type='checkbox']")
    onCheckboxValueChange (event) {
        let parent = event.srcElement.shadowRoot.querySelector("[data-role='parent']");

        this.state.toggle();

        if(this.state.isCompleted()) {
            parent.classList.remove("active");
            parent.classList.add("completed");
        } else {
            parent.classList.remove("completed");
            parent.classList.add("active");
        }

        this.emit(this.state.isCompleted());
    }

    /**
     * Toggle between two states.
     *
     * @param view {HTMLElement} The view element
     * @param edit {HTMLElement} The edit element
     * @param parent {HTMLElement} The parent element (LI)
     */
    toggleViewState ({ view, edit, parent }) {
        switch(this.state.get("editing")) {
            case true: {
                view.style.display = "block";
                edit.style.display = "none";
                parent.classList.toggle("editing");
                this.state.set("editing", false);
                break;
            }

            case false:
            default: {
                edit.style.display = "block";
                view.style.display = "none";
                parent.classList.toggle("editing");
                this.state.set("editing", true);
                break;
            }
        }
    }

    /**
     * When the user double clicks the label, we'll switch to the edit state.
     *
     * @param event {Event} The dblclick event
     */
    @on("dblclick label")
    onLabelDoubleClick (event) {
        const view = event.srcElement.shadowRoot.querySelector(".view");
        const edit = event.srcElement.shadowRoot.querySelector(".edit");
        const parent = event.srcElement.shadowRoot.querySelector("[data-role='parent']");

        this.toggleViewState({ view, edit, parent });

        edit.focus();
        edit.select();
    }

    /**
     * When the user unfocuses the input, we'll switch back to the default state.
     *
     * @param event {Event} The blur event
     */
    @on("blur .edit")
    onEditBlur (event) {
        const view = event.srcElement.shadowRoot.querySelector(".view");
        const edit = event.srcElement.shadowRoot.querySelector(".edit");
        const parent = event.srcElement.shadowRoot.querySelector("[data-role='parent']");

        if("" !== edit.value.trim()) {
            this.state.set("title", edit.value);
            view.querySelector("label").innerText = this.state.get("title");
        } else {
            this.state.set("title", view.querySelector("label").innerText);
            edit.value = this.state.get("title");
        }

        this.toggleViewState({ view, edit, parent });
    }

    /**
     * When the user lets go of a key, we'll simply check if it's enter or escape & then toggle state if it is.
     *
     * @param event {Event} The keyup event
     */
    @on("keyup .edit")
    onEditKeyup (event) {
        if(this.state.get("editing")) {
            console.log(event.code);
            switch (event.code) {
                case "Escape":
                case "NumpadEnter":
                case "Enter": {
                    event.srcElement.shadowRoot.querySelector(".edit").blur();
                    break;
                }
            }
        }
    }

    /**
     * Emit state to the parent View
     *
     * @param state {Boolean} True if we're set as completed.
     */
    emit (state) {
        this.radioChannel.trigger("stateChange", state);
    }

    remove () {
        const listItem = this._element.shadowRoot.querySelector("li");

        listItem.addEventListener("transitionend", e => {
            listItem.style.display = "none";
        });

        listItem.style.transform = "translateX(-100%)";
    }

    setupEventListeners () {
        this.radioChannel.on("clear-completed", _ => {
            if(this.state.isCompleted()) {
                this.remove();
            }
        });
    }

}

/**
 *  Export the Component
 *
 * @exports TodoItem
 */
export default TodoItem;