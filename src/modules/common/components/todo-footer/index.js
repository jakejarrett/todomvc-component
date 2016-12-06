import App from "app/app";
import { Component, on } from "@jakejarrett/marionette-component";
import Template from "./index.html";
import * as Styles from "!css?modules!sass!./style.scss";

/**
 * Add todo items
 */
class TodoFooter extends Component {

    /**
     * Setup our component.
     */
    constructor (elementName, props, localCompName) {
        super(elementName, localCompName);

        this.render(elementName, props);

        return this;
    }

    /**
     * Render the component
     *
     * @param elementName {String} The element's name eg/ <element-name>)
     * @param props {Object} Properties
     */
    render (elementName, props) {
        const renderedTemplate = _.template(Template)(props);

        this.renderComponent(elementName, renderedTemplate, Styles);

        this.setupRadioEventListeners();
    }

    /**
     * Setup radio event listeners
     */
    setupRadioEventListeners () {
        this.radioChannel.on("update-state", value => {
            const countEl = this._element.shadowRoot.querySelector("#todo-count");
            const footerEl = this._element.shadowRoot.querySelector("#footer");
            let count;

            if(-1 === Math.sign(value.count)) {
                count = 0;
            } else {
                count = value.count;
            }

            countEl.querySelector("#count").innerText = count;

            if(1 === value.count) {
                countEl.querySelector("#grammar").innerText = "item";
            } else {
                countEl.querySelector("#grammar").innerText = "items";
            }

            if(0 === value.count && !value.hasItems) {
                footerEl.style.display = "none";
            } else {
                footerEl.style.display = "block";
            }

        });
    }

    /**
     * When the user clicks "Clear completed", we'll emit an event to do so & unfocus the button.
     */
    @on("click #clear-completed")
    clearCompleted (e) {
        e.path[0].blur();
        this.radioChannel.trigger("clear-completed");
    }

    /**
     * When the user clicks one of the filters, we'll handle the functionality
     *
     * @param event {Event} The click event
     */
    @on("click a")
    onFiltersClick (event) {
        event.preventDefault();
        const parent = event.target.shadowRoot;
        const el = event.path[0];

        parent.querySelector(".selected").classList.remove("selected");
        el.classList.add("selected");
        this.radioChannel.trigger("show-type", el.innerText.toLocaleLowerCase());
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
 * @exports TodoFooter
 */
export default TodoFooter;