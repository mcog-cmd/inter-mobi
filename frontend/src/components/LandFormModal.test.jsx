import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandFormModal from "./LandFormModal";

describe("LandFormModal", () => {
    const setup = (props = {}) => {
        const onSubmit = jest.fn();
        const onClose = jest.fn();
        render(<LandFormModal onSubmit={onSubmit} onClose={onClose} {...props} />);
        return { onSubmit, onClose };
    };

    it("renders title, description, fields and buttons", () => {
        setup();

        expect(screen.getByRole("heading", { name: "Register land" })).toBeInTheDocument();
        expect(screen.getByText("Enter the information about the land.")).toBeInTheDocument();
        expect(screen.getByLabelText("Price")).toBeInTheDocument();
        expect(screen.getByLabelText("Description")).toBeInTheDocument();
        expect(screen.getByLabelText("Contact")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Register land" })).toBeInTheDocument();
    });

    it("does not render the error box when there is no error", () => {
        setup();
        expect(document.querySelector(".form-error")).toBeNull();
    });

    it("renders the error message when error prop is provided", () => {
        setup({ error: "Something went wrong" });
        expect(screen.getByText("Something went wrong")).toHaveClass("form-error");
    });

    it("updates the fields while typing", async () => {
        const user = userEvent.setup();
        setup();

        await user.type(screen.getByLabelText("Price"), "150000");
        await user.type(screen.getByLabelText("Description"), "Big land");
        await user.type(screen.getByLabelText("Contact"), "john@mail.com");

        expect(screen.getByLabelText("Price")).toHaveValue(150000);
        expect(screen.getByLabelText("Description")).toHaveValue("Big land");
        expect(screen.getByLabelText("Contact")).toHaveValue("john@mail.com");
    });

    it("calls onSubmit with the typed values", async () => {
        const user = userEvent.setup();
        const { onSubmit } = setup();

        await user.type(screen.getByLabelText("Price"), "150000");
        await user.type(screen.getByLabelText("Description"), "Big land");
        await user.type(screen.getByLabelText("Contact"), "john@mail.com");
        await user.click(screen.getByRole("button", { name: "Register land" }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({
            price: "150000",
            description: "Big land",
            contact: "john@mail.com"
        });
    });

    it("calls onSubmit with empty values when the form is untouched", () => {
        const { onSubmit } = setup();

        fireEvent.submit(screen.getByRole("button", { name: "Register land" }).closest("form"));

        expect(onSubmit).toHaveBeenCalledWith({
            price: "",
            description: "",
            contact: ""
        });
    });

    it("calls onClose when cancel is clicked and does not submit", async () => {
        const user = userEvent.setup();
        const { onClose, onSubmit } = setup();

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});