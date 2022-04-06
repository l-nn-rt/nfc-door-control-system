import {HttpService} from "../src/services/http.service";
import axios from "../__mocks__/axios";

jest.mock('axios');

/**
 * Managed to write first axios mock that works
 *
 * @author Lennart Rak
 */
describe("Small Test", () => {
    test("test axios", async () => {

        axios.mockReturnValueOnce(Promise.resolve({data: {}, status: 201}));

       await expect(HttpService.getInstance().post("https://quatsch.com")).resolves.toMatchObject({status: 201});

    });
});

export {}