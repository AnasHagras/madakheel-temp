import React, { useEffect, useState } from "react";
import PageHeader from "../../../shared/layout-components/page-header/page-header";
import { Card, Col, FormGroup, Row, Form } from "react-bootstrap";
import Link from "next/link";
import Seo from "../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../utils/getUserCookies";
import logout from "../../../utils/logout";

const AddProduct = () => {
  const { id, token } = getUserCookies();
  
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [data, setData] = useState([]);
  console.log('data', data);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/transferred-to-info/1/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => {
        setData(data);
        setName(data?.name !== "null" ? data.name : '');
        setLicense(data?.license_number !== "null" ? data.license_number : '');
        setVatNumber(data?.vat_number !== "null" ? data.vat_number : '');
        setVatPercentage(data?.vat_percentage !== "null" ? data.vat_percentage : '');
        setAddress(data?.address !== "null" ? data.address : '');
        setMobile(data?.mobile !== "null" ? data.mobile : '');
        setRepresentativeName(data?.representative_name !== "null" ? data.representative_name : '');
        setRepresentativeNationalId(data?.representative_national_id !== "null" ? data.representative_national_id : '');
        setRepresentativeNationality(data?.representative_nationality !== "null" ? data.representative_nationality : '');
        setImgUrl(`${data?.logo_image}`);
        setSignatureImgUrl(`${data?.signature_image}`);
        setStampImgUrl(`${data?.stamp_image}`);
      });
  }, [token]);
  const [files, setFiles] = useState([]);

  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [vatPercentage, setVatPercentage] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeNationalId, setRepresentativeNationalId] = useState('');
  const [representativeNationality, setRepresentativeNationality] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [signatureImgUrl, setSignatureImgUrl] = useState('');
  const [stampImgUrl, setStampImgUrl] = useState('');
  const [file, setFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);

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
    fd.append("representative_name", representativeName);
    fd.append("representative_national_id", representativeNationalId);
    fd.append("representative_nationality", representativeNationality);

    if (file) {
      fd.append("logo_image ", file);
    }
    if (signatureFile) {
      fd.append("signature_image", signatureFile);
    }
    if (stampFile) {
      fd.append("stamp_image", stampFile);
    }

    const res = await fetch(
      `${baseUrl}/api/v1/transferred-to-info/1/`,
      {
        method: "PATCH",
        body: fd,
        headers: {
          Authorization: token,
        },
      },
    );
    if(res.status == 401){
      logout()
    }
    const result = await res.json();

    if (result.id && res.status === 200) {
      setLoading(false);
      toast.success("تم تحديث بيانات شركة التسويق بنجاح");
    } else {
      setLoading(false);
      toast.error("حدث خطأ ما حاول مرة أخرى");
    }
    setLoading(false);
  };

  return (
    <>
      <Seo title='بيانات شركة التسويق' />

      <PageHeader
        title='بيانات شركة التسويق'
        item='شركة وحيد'
        active_item='بيانات شركة التسويق'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col lg={12} md={12}>
            <Form onSubmit={(e) => submitForm(e)}>
              <Card className='custom-card'>
                <Card.Body>
                  <FormGroup className='form-group'>
                    <Form.Label>الاسم</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='اسم شركة التسويق'
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
                    <Form.Label> اسم ممثل شركة التسويق</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder=' اسم ممثل شركة التسويق '
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <Form.Label>رقم الهوية</Form.Label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder=' رقم هوية ممثل شركة التسويق '
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
                      placeholder='  جنسية ممثل شركة التسويق '
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
              
                  <hr />
                </Card.Body>
                <div className='card-footer'>
                  <button
                    disabled={loading}
                    className='btn btn-primary btn-lg  me-3 px-5'
                  >
                    {loading ? "جاري الحفظ ..." : "حفظ"}
                  </button>
                </div>
              </Card>
            </Form>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>
    </>
  );
};

AddProduct.layout = "Contentlayout";

export default AddProduct;
