import axiosInstance from "../axiosInstance";

const getAllTransaction = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/get`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Error in getting transaction");
  }
};

interface sendToFacturaInterface {
  transactionId: string;
  name: string; // Nombre
  userId: string; //Numero
  email: string; // CorreoElectronico
  phoneNumber: string;
  code: string;
  isBusiness: boolean;
  BusinessName: string | "";
}

const sendToFactura = async (data: sendToFacturaInterface) => {
  const dataToSend = {
    Nombre: data.name,
    // Tipo: data.userType,
    Numero: data.userId,
    CorreoElectronico: data.email,
    phoneNumber: data.phoneNumber,
    code: data.code,
    isBusiness: data.isBusiness,
    BusinessName: data.BusinessName,
  };

  try {
    const id = data.transactionId;
    if (!id || typeof id !== "string") {
      throw new Error("Invalid transaction ID");
    }

    const response = await axiosInstance.post(
      `/api/v1/send-factura/${id}`,
      dataToSend
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error(
      error instanceof Error ? error.message : "Error in sending to factura"
    );
  }
};

const getAllCustomers = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/admin/customer`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Error in Getting All customers");
  }
};
const getAllFacturas = async (page: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/v1/getAllFactura?page=${page}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error((error as string) || "Error in Getting All Facturas");
  }
};
export { getAllTransaction, sendToFactura, getAllCustomers, getAllFacturas };
