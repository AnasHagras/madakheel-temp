import React, { useEffect, useState } from "react";
import PageHeader from "../../../shared/layout-components/page-header/page-header";
import { Card, Col, FormGroup, Row, Form } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../utils/getUserCookies";
import logout from "../../../utils/logout";


const AddProduct = () => {
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [info, setInfo] = useState({});
  const [payments, setPayments] = useState([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [banks, setBanks] = useState([{ bankName: "", bankNumber: "", bankIban: "" ,bankCompany :""}]);
  const maxBanks = 3;
  const minBanks = 1;

  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [vatPercentage, setVatPercentage] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [iban, setIban] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeNationalId, setRepresentativeNationalId] = useState('');
  const [representativeNationality, setRepresentativeNationality] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [signatureImgUrl, setSignatureImgUrl] = useState('');
  const [stampImgUrl, setStampImgUrl] = useState('');
  const [file, setFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const user = getUserCookies();
  const { token, id, user_type } = user;

  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === "بيانات الشركة"
      );
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === "تعديل");

      setIsCanUpdate(canUpdate);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getUserCookies();
        if (user) {
          setAdmin(user);

          const res = await fetch(`${baseUrl}/api/v1/company-info/`, {
            headers: {
              Authorization: ` ${user.token}`,
            },
          });
          if (res.status === 401) {
            logout();
          }
          const data = await res.json();
          setInfo(data.data.info);
          setPayments(data.data.payment_types);

          // Set state based on fetched info
          setName(data.data.info?.name || "");
          setLicense(data.data.info?.license_number || "");
          setVatNumber(data.data.info?.vat_number || "");
          setVatPercentage(data.data.info?.vat_percentage || "");
          setAddress(data.data.info?.address || "");
          setMobile(data.data.info?.mobile || "");
          setWhatsapp(data.data.info?.whatsapp || "");
          setEmail(data.data.info?.email || "");
          setIban(data.data.info?.iban || "");
          setRepresentativeName(data.data.info?.representative_name || "");
          setRepresentativeNationalId(data.data.info?.representative_national_id || "");
          setRepresentativeNationality(data.data.info?.representative_nationality || "");
          setImgUrl(`${baseUrl}/${data.data.info?.logo_image}`);
          setSignatureImgUrl(`${baseUrl}/${data.data.info?.signature_image}`);
          setStampImgUrl(`${baseUrl}/${data.data.info?.stamp_image}`);
          const info = data.data.info;

          const bankAccounts = [
            {
              bankName: info?.bank_acc_name || "",
              bankNumber: info?.bank_acc_num || "",
              bankIban: info?.bank_acc_iban || "",
              bankCompany: info?.bank_acc_bank || "",
            },
            {
              bankName: info?.bank_acc_name_sec || "",
              bankNumber: info?.bank_acc_num_sec || "",
              bankIban: info?.bank_acc_iban_sec || "",
              bankCompany: info?.bank_acc_bank_sec || "",
            },
            {
              bankName: info?.bank_acc_name_third || "",
              bankNumber: info?.bank_acc_num_third || "",
              bankIban: info?.bank_acc_iban_third || "",
              bankCompany: info?.bank_acc_bank_third || "",
            },
          ].filter((bank) => bank.bankName || bank.bankNumber || bank.bankIban); // Filter out empty banks

          setBanks(
            bankAccounts.length > 0
              ? bankAccounts
              : [{ bankName: "", bankNumber: "", bankIban: "" }]
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChangeImage = (e) => {
    setFile(e.target.files[0]);
    setImgUrl(URL.createObjectURL(e.target.files[0]));
  };

  const handleChangeSignatureImage = (e) => {
    setSignatureFile(e.target.files[0]);
    setSignatureImgUrl(URL.createObjectURL(e.target.files[0]));
  };

  const handleChangeStampImage = (e) => {
    setStampFile(e.target.files[0]);
    setStampImgUrl(URL.createObjectURL(e.target.files[0]));
  };

  const handlePaymentChange = (e) => {
    const { name, checked } = e.target;
    setPayments((prevPayments) =>
      prevPayments.map((payment) =>
        payment.name === name ? { ...payment, enabled: checked } : payment
      )
    );
  };

  const handleBankChange = (index, key, value) => {
    const updatedBanks = [...banks];
    updatedBanks[index][key] = value;
    setBanks(updatedBanks);
  };

  const addBank = () => {
    if (banks.length < maxBanks) {
      setBanks([...banks, { bankName: "", bankNumber: "", bankIban: "" ,bankCompany: ""}]);
    }
  };

  const removeBank = () => {
    if (banks.length > minBanks) {
      setBanks(banks.slice(0, banks.length - 1));
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);

    const paymentForm = new FormData();
    const fd = new FormData();

    fd.append("name", name);
    fd.append("license_number", license);
    fd.append("vat_number", vatNumber);
    fd.append("vat_percentage", vatPercentage);
    fd.append("address", address);
    fd.append("mobile", mobile);
    fd.append("whatsapp", whatsapp);
    fd.append("email", email);
    fd.append("iban", iban);
    fd.append("representative_name", representativeName);
    fd.append("representative_national_id", representativeNationalId);
    fd.append("representative_nationality", representativeNationality);
    console.log('banks', banks);

    const bankNames = ["bank_acc_name", "bank_acc_name_sec", "bank_acc_name_third"];

    banks.forEach((bank, index) => {
      // Check if the index has a corresponding bank name
      if (bankNames[index]) {
        fd.append(bankNames[index], bank.bankName);
        fd.append(bankNames[index].replace("name", "num"), bank.bankNumber); // Change "name" to "num"
        fd.append(bankNames[index].replace("name", "iban"), bank.bankIban); // Change "name" to "iban"
        fd.append(bankNames[index].replace("name", "bank"), bank.bankCompany); // Change "name" to "iban"
      }
    });
    if (file) {
      fd.append("logo_image", file);
    }
    if (signatureFile) {
      fd.append("signature_image", signatureFile);
    }
    if (stampFile) {
      fd.append("stamp_image", stampFile);
    }

    try {
      // for (const payment of payments) {
      //   paymentForm.append("enabled", payment.enabled);

      //   await fetch(`${baseUrl}/api/v1/payment/payment-types/${payment.id}/`, {
      //     method: "PATCH",
      //     headers: {
      //       Authorization: admin.token,
      //     },
      //     body: paymentForm,
      //   });
      // }

      const res = await fetch(
        `${baseUrl}/api/v1/update-company-info/1/?admin_id=${admin.id}`,
        {
          method: "PATCH",
          body: fd,
          headers: {
            Authorization: admin.token,
          },
        }
      );
      if (res.status === 401) {
        logout();
      }
      const result = await res.json();

      if (result.id && res.status === 200) {
        toast.success("تم تحديث بيانات الشركة بنجاح");
      } else {
        toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
      }
    } catch (error) {
      toast.error("حدث خطأ ما حاول مرة أخرى");
      console.error("Error submitting form:", error);
    }

    setLoading(false);
  };

  return (
    <>
      <Seo title="بيانات الشركة" />

      <PageHeader
        title="بيانات الشركة"
        item="شركة وحيد"
        active_item="بيانات الشركة"
      />

      <div>
        <Row className="row-sm">
          <Col lg={12} md={12}>
            <Form onSubmit={(e) => submitForm(e)}>
              <Card className="custom-card">
                <Card.Body>
                  <FormGroup className='form-group'>
                    <Form.Label>الاسم</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='اسم الشركة'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>رقم الترخيص</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='رقم الترخيص'
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>رقم السجل التجاري</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='رقم السجل التجاري'
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>النسبة الضريبية</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder=' النسبة الضريبية'
                      value={vatPercentage}
                      onChange={(e) => setVatPercentage(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>العنوان</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='العنوان'
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label> الجوال</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='رقم الجوال'
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label> واتساب</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='رقم الواتساب'
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label> البريد الإلكتروني</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='البريد الإلكتروني'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label> IBAN</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder=' IBAN '
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label> اسم ممثل الشركة</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder=' اسم ممثل الشركة '
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>رقم الهوية</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder=' رقم هوية ممثل الشركة '
                      value={representativeNationalId}
                      onChange={(e) =>
                        setRepresentativeNationalId(e.target.value)
                      }
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label> الجنسية</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='  جنسية ممثل الشركة '
                      value={representativeNationality}
                      onChange={(e) =>
                        setRepresentativeNationality(e.target.value)
                      }
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>الشعار</Form.Label>
                    <img
                      src={imgUrl}
                      className='my-3'
                      alt='logo'
                      height={150}
                    />
                    <input
                      onChange={(e) => handleChangeImage(e)}
                      type='file'
                      accept='image/png, image/jpeg, image/jpg'
                      className='form-control'
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>التوقيع</Form.Label>
                    <img
                      src={signatureImgUrl}
                      className='my-3'
                      alt='logo'
                      height={150}
                    />
                    <input
                      onChange={(e) => handleChangeSignatureImage(e)}
                      type='file'
                      accept='image/png, image/jpeg, image/jpg'
                      className='form-control'
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>الختم</Form.Label>
                    <img
                      src={stampImgUrl}
                      className='my-3'
                      alt='logo'
                      height={150}
                    />
                    <input
                      onChange={(e) => handleChangeStampImage(e)}
                      type='file'
                      accept='image/png, image/jpeg, image/jpg'
                      className='form-control'
                    />
                  </FormGroup>
                  <FormGroup className="form-group">
                    <h6 className="font-weight-bold mb-3">حسابات البنوك</h6>
                    {banks.map((bank, index) => (
                      <div key={index} className="mb-4">
                        <h6>حساب البنك {index + 1}</h6>
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="اسم البنك"
                          value={bank.bankName}
                          onChange={(e) =>
                            handleBankChange(index, "bankName", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="رقم الحساب"
                          value={bank.bankNumber}
                          onChange={(e) =>
                            handleBankChange(index, "bankNumber", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="الايبان"
                          value={bank.bankIban}
                          onChange={(e) =>
                            handleBankChange(index, "bankIban", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="اسم الشركة في البنك"
                          value={bank.bankCompany}
                          onChange={(e) =>
                            handleBankChange(index, "bankCompany", e.target.value)
                          }
                        />
                      </div>
                    ))}
                    {/* Add/Remove Buttons */}
                    <div className="d-flex align-items-center justify-content-between">
                      {banks.length < maxBanks && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={addBank}
                        >
                          + إضافة حساب جديد
                        </button>
                      )}
                      {banks.length > minBanks && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={removeBank}
                        >
                          - إزالة حساب
                        </button>
                      )}
                    </div>
                  </FormGroup>

                  {/* <FormGroup className='form-group'>
                    <h6 className='font-weight-bold mb-3'> طرق الدفع </h6>
                    {payments.map((payment, index) => {
                      return (
                        <div key={index} className='form-check form-check-inline d-flex flex-column align-items-start'>
                          <img
                            src={`${baseUrl}${payment?.icon_file}`}
                            className='my-3'
                            alt='logo'
                            height={100}
                          />
                          <div className="d-flex align-items-center">

                            <input
                              className='form-check-input fs-4'
                              type='checkbox'
                              id={payment.id}
                              name={payment.name}
                              value={payment.id}
                              checked={payment.enabled}
                              onChange={(e) => handlePaymentChange(e)}
                            />
                            <label className='form-check-label fs-4' htmlFor={payment.id}>
                              {payment.name}
                            </label>
                          </div>

                        </div>
                      )
                    })}
                  </FormGroup> */}
                  <hr />
                </Card.Body>
                {
                  user_type === "ADM" || isCanUpdate ?

                    <div className="card-footer">
                      <button
                        disabled={loading}
                        className="btn btn-primary btn-lg  me-3 px-5"
                      >
                        {loading ? "جاري الحفظ ..." : "حفظ"}
                      </button>
                    </div>
                    : ''
                }
              </Card>
            </Form>
          </Col>
        </Row>
      </div>
    </>
  );
};

AddProduct.layout = "Contentlayout";

export default AddProduct;
