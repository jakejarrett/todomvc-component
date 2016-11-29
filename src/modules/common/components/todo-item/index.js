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
    constructor (elementName, {value}, localCompName) {
        console.log(localCompName);
        super(elementName, localCompName);
        this._el = "";
        this.localName = localCompName;

        /** New model **/
        this.state = new TodoModel({
            title: value
        });

        this.render(elementName, value, localCompName);

        return this;
    }

    /**
     * Render method, we define the initial state here.
     *
     * @param elementName {String} The element name we've been designated.
     */
    render (elementName) {
        this.elementName = elementName;
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
        const el = event.target.shadowRoot;

        if(event.target.getAttribute("data-id") !== this.localName) {
            this.localName = event.target.getAttribute("data-id");
        }

        let parent = el.querySelector("[data-role='parent']");

        const isCompleted = parent.classList.contains("active");

        this.state.set("completed", isCompleted);

        if(isCompleted) {
            parent.classList.remove("active");
            parent.classList.add("completed");
        } else {
            parent.classList.remove("completed");
            parent.classList.add("active");
        }

        this.emit({ state: isCompleted, target: event.target.getAttribute("data-id") });
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
        const el = event.target.shadowRoot;

        const view = el.querySelector(".view");
        const edit = el.querySelector(".edit");
        const parent = el.querySelector("[data-role='parent']");

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
        const el = event.target.shadowRoot;

        const view = el.querySelector(".view");
        const edit = el.querySelector(".edit");
        const parent = el.querySelector("[data-role='parent']");

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
        const el = event.target.shadowRoot;

        if(this.state.get("editing")) {
            switch (event.code) {
                case "Escape":
                case "NumpadEnter":
                case "Enter": {
                    el.querySelector(".edit").blur();
                    break;
                }
            }
        }
    }

    @on("click .destroy")
    onDestroyClick () {
        const el = event.target.shadowRoot;

        el.querySelector(".destroy").style.display = "none";
        this.remove(el, event.target.getAttribute("data-id"));
    }

    /**
     * Emit state to the parent View
     *
     * @param state {Boolean} True if we're set as completed.
     * @param target {String} The data-id attribute set on the root element
     */
    emit ({ state, target }) {
        this.radioChannel.trigger("stateChange", { state, target });
    }

    remove (el, lookup) {
        const listItem = el.querySelector("li");

        listItem.addEventListener("transitionend", e => {
            listItem.style.display = "none";
            console.log(lookup);
            this.radioChannel.trigger("remove-item", lookup);
        });

        listItem.style.transform = "translateX(-100%)";
    }

    setupEventListeners () {
        const that = this;

        this.radioChannel.on("clear-completed", lookup => {
            const el = document.querySelector(`[data-id='${lookup}']`).shadowRoot;
            const parent = el.querySelector("[data-role='parent']");
            const isCompleted = parent.classList.contains("completed");

            if(isCompleted) {
                this.remove(el, lookup);
            }
        });

        this.radioChannel.on("show-type", type => {
            const channelName = this.radioChannel.channelName;
            const domIdName = channelName.substring(channelName.indexOf(":") + 1);
            const listItem = document.querySelector(`[data-id='${domIdName}']`).shadowRoot.querySelector("li");

            switch(type) {
                case "active":
                case "completed": {
                    if(!listItem.classList.contains(type)) {
                        listItem.style.display = "none";
                    } else {
                        listItem.style.display = "list-item";
                    }
                    break;
                }

                case "all":
                default: {
                    listItem.removeAttribute("style");
                    break;
                }
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