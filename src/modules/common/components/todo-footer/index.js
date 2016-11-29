import App from "app/app";
import { Component, on } from "marionette.component";
import Template from "./index.html";
import * as Styles from "!css?modules!sass!./style.scss";

/**
 * Add todo items
 */
class TodoFooter extends Component {

    /**
     * Setup our component.
     */
    constructor (elementName, props) {
        super(elementName);

        this.render(elementName, props);

        return this;
    }

    render (elementName, props) {
        const renderedTemplate = _.template(Template)(props);

        this.renderComponent(elementName, renderedTemplate, Styles);

        this.setupRadioEventListeners();
    }

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

    @on("click #clear-completed")
    clearCompleted () {
        this.radioChannel.trigger("clear-completed");
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