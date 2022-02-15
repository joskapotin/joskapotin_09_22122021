import { screen, fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import Router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import firebase from "../__mocks__/firebase.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "johndoe@email.com",
          password: "azerty",
          status: "connected",
        })
      );
    });
    test("Then it should show the new bill form", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
    test("Then the mail icon in vertical layout should be highlighted", () => {
      const html = '<div id="root"></div>';
      document.body.innerHTML = html;
      Router();
      window.onNavigate(ROUTES_PATH["NewBill"]);
      const icon = screen.getByTestId("icon-mail");
      expect(icon).toHaveClass("active-icon");
    });
    describe("Given that i select a file", () => {
      describe("When the file extention is not allowed", () => {
        test("Then it should not fire the store method and open an alert", () => {
          const html = NewBillUI();
          document.body.innerHTML = html;

          const newBill = new NewBill({
            document,
            onNavigate: null,
            localStorage: null,
            firestore: jest.fn(),
          });

          const refMock = jest.fn();
          newBill.firestore.storage = refMock;

          const input = screen.getByTestId("file");
          Object.defineProperty(input, "files", {
            value: [
              new File(["chucknorris"], "chucknorris.txt", {
                type: "text/plain",
              }),
            ],
            writable: true,
          });

          const alertMock = jest.fn();
          window.alert = alertMock;

          const handleChangeFile = jest.fn(newBill.handleChangeFile);
          input.addEventListener("change", handleChangeFile);

          fireEvent.change(input);

          expect(handleChangeFile).toHaveBeenCalled();
          expect(alertMock).toHaveBeenCalled();
          expect(refMock).not.toHaveBeenCalled();
        });
      });
      describe("When the file extention is allowed", () => {
        test("Then it should fire the storage method and not open an alert", () => {
          const html = NewBillUI();
          document.body.innerHTML = html;

          const firestore = jest.fn();
          const newBill = new NewBill({
            document,
            onNavigate: null,
            localStorage: null,
            firestore,
          });

          const snapshot = {
            ref: {
              getDownloadURL: jest
                .fn()
                .mockResolvedValue("http://www.chucknorris.com"),
            },
          };

          const putMock = jest.fn().mockResolvedValue(snapshot);
          const refMock = jest.fn(fileName => ({ put: putMock }));
          Object.defineProperty(firestore, "storage", {
            value: {
              ref: refMock,
            },
            writable: true,
          });
          const input = screen.getByTestId("file");
          Object.defineProperty(input, "files", {
            value: [
              new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" }),
            ],
            writable: true,
          });

          const alertMock = jest.fn();
          window.alert = alertMock;

          const handleChangeFile = jest.fn(newBill.handleChangeFile);
          input.addEventListener("change", handleChangeFile);

          fireEvent.change(input);

          expect(handleChangeFile).toHaveBeenCalled();
          expect(alertMock).not.toHaveBeenCalled();
          expect(refMock).toHaveBeenCalled();
        });
      });
    });
  });
  describe("When i submit the form", () => {
    test("Then it should fire the handleSubmit method and return to the bills page", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = pathname => {
        const html = ROUTES({ pathname, data: [] });
        document.body.innerHTML = html;
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: null,
        firestore: null,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy;
    });
  });
});

// test d'intégration POST
describe("Given I am a user connected as an Employee", () => {
  describe("When I submit a new bill", () => {
    test("Then it should post the new bill", async () => {
      const postSpy = jest.spyOn(firebase, "post");
      const newBill = {
        id: "idtest",
      };
      const bills = await firebase.post(newBill);
      expect(postSpy).toHaveBeenCalled();
      expect(bills.data.length).toBe(1);
      expect(bills.data[0].id).toBe("idtest");
    });
    describe("When the API fails with 404 error", () => {
      test("Then it should render 404 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        );
        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
    });
    describe("When the API fails with 500 error", () => {
      test("Then it should render 500 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        );
        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
