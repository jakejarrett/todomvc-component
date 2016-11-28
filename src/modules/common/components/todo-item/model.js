import { Model } from "backbone";
import { attributes } from "../../controllers/decorators";

@attributes({
    defaults: {
        title: "",
        completed: false,
        created: 0,
        editing: false
    }
})
class TodoModel extends Model {

    /**
     * Initialization
     */
    initialize () {
        if(this.isNew()) {
            this.set("created", Date.now());
        }
    }

    /**
     * Toggle the state
     */
    toggle () {
        return this.set("completed", !this.isCompleted());
    }

    /**
     * is completed
     */
    isCompleted () {
        return this.get("completed");
    }

    matchesFilter () {
        switch(filter) {
            case "all": {
                return true;
            }

            case "active": {
                return !this.isCompleted();
            }

            default: {
                return this.isCompleted();
            }
        }

    }

}

export default TodoModel;
