import { useState } from "react";

const LandFormModal = ({ onSubmit, onClose }) => {
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [contact, setContact] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            price,
            description,
            contact
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>Register land</h2>
                    <p>Enter the information about the land.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="price">Price</label>
                        <input
                            id="price"
                            type="number"
                            placeholder="Enter the price"
                            value={price}
                            onChange={(event) => setPrice(event.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            placeholder="Describe the land"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="contact">Contact</label>
                        <input
                            id="contact"
                            type="text"
                            placeholder="Enter your contact"
                            value={contact}
                            onChange={(event) =>
                                setContact(event.target.value)
                            }
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="button-cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="button-submit"
                        >
                            Register land
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LandFormModal;