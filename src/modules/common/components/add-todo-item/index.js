import App from "app/app";
import { Component, on } from "marionette.component";
import Template from "./index.html";
import * as Styles from "!css?modules!sass!./style.scss";

/**
 * Add todo items
 */
class AddTodo extends Component {

    /**
     * Setup our component.
     */
    constructor (elementName, props, localCompName) {
        super(elementName, localCompName);

        this.render(elementName);

        return this;
    }

    render (elementName) {
        const renderedTemplate = _.template(Template)();

        this.renderComponent(elementName, renderedTemplate, Styles);
    }

    /**
     * When the user submits the form.
     *
     * @param event {Event} The submit event.
     */
    @on("submit")
    onFormSubmit (event) {
        event.preventDefault();
        const el = this._element.shadowRoot.querySelector("input");
        this.emit("add-item", el.value);
        el.value = "";
    }

    /**
     * Emit events
     *
     * @param eventType
     * @param attribute
     */
    emit (eventType, attribute) {
        this.radioChannel.trigger(eventType, attribute);
    }

}

/**
 *  Export the Component
 *
 * @exports AddTodo
 */
export default AddTodo;