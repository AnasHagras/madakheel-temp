import React, { useState, useEffect } from "react";
import PageHeader from "../../../shared/layout-components/page-header/page-header";
import { Card, Col, FormGroup, Row, Form, FormControl } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../utils/getUserCookies";
import logout from "../../../utils/logout";

const Page = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const user = getUserCookies();
  const { token, id, user_type } = user;
  const [isCanUpdate, setIsCanUpdate] = useState(false);


  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'نموذج العقد'
      );

      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'اضافة');


      setIsCanUpdate(canUpdate);
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({
    preface: "",
    item1: "",
    item2: "",
    item3: "",
    item4: "",
    item5: "",
    item6: "",
    item7: "",
    item8: "",
    item9: "",
    item10: "",
    item11: "",
    item12: "",
    item13: "",
    item14: "",
    item15: "",
    item16: "",
    item17: "",
    item18: "",
    item19: "",
    item20: "",
    item21: "",
    item22: "",
    item23: "",
    item24: "",
    item25: "",
    title1: "",
    title2: "",
    title3: "",
    title4: "",
    title5: "",
    title6: "",
    title7: "",
    title8: "",
    title9: "",
    title10: "",
    title11: "",
    title12: "",
    title13: "",
    title14: "",
    title15: "",
    title16: "",
    title17: "",
    title18: "",
    title19: "",
    title20: "",
    title21: "",
    title22: "",
    title23: "",
    title24: "",
    title25: "",
  });



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/last_contract/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${user.token}`,
          },
        });
        if (res.status == 401) {
          logout()
        }
        const data = await res.json();
        setFormState(data);
      } catch (error) {
        toast.error("حدث خطأ ما حاول مرة أخرى");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const res = await fetch(`${baseUrl}/api/v1/contract_template/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${user.token}`,
      },
      body: JSON.stringify(formState),
    });
    if (res.status == 401) {
      logout()
    }
    const data = await res.json();
    setLoading(false);
    if (data.id) {
      toast.success("تم الحفظ بنجاح");
      window.scrollTo(0, 0);
    } else {
      toast.error(data.message || data.error || data.detail || "حدث خطأ ما حاول مرة أخرى");
    }
  };

  return (
    <>
      <Seo title="نموذج العقد" />
      <PageHeader title="نموذج العقد" item="شركة وحيد" active_item="نموذج العقد" />

      <div>
        {/* <!-- Row --> */}
        <Row className="row-sm">
          <Col lg={12} md={12}>
            <Form onSubmit={handleSubmit}>
              <Card className="custom-card">
                <Card.Body>
                  <FormGroup>
                    <Form.Label className="font-weight-bold">المقدمة</Form.Label>
                    <FormControl
                      as="textarea"
                      rows={6}
                      value={formState.preface}
                      className="mb-4"
                      name="preface"
                      placeholder="ادخل المقدمة"
                      type="text"
                      onChange={(e) => {
                        setFormState({
                          ...formState,
                          [e.target.name]: e.target.value,
                        });
                      }}
                    ></FormControl>
                  </FormGroup>
                  <ContractForm formState={formState} setFormState={setFormState} />
                </Card.Body>
                {
                  user_type === "ADM" || isCanUpdate ?

                    <div className="card-footer">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg me-3 px-5"
                        disabled={loading}
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
        {/* <!-- End Row --> */}
      </div>
    </>
  );
};

Page.layout = "Contentlayout";

export default Page;

const ContractForm = ({ formState, setFormState }) => {
  const numberOfGroups = 25;
  const groups = [];
  for (let i = 0; i < numberOfGroups; i++) {
    groups.push(
      <ObjectForm
        formState={formState}
        setFormState={setFormState}
        key={i}
        i={i}
      />
    );
  }
  return <>{groups}</>;
};

const ObjectForm = ({ i, setFormState, formState }) => {
  const handleChange = (event) => {
    setFormState({
      ...formState,
      [event.target.name]: event.target.value,
    });
  };
  return (
    <FormGroup key={i} className="mb-4">
      <Form.Label className="mb-3 font-weight-bold">البند - {i + 1}</Form.Label>
      {i === 4 && (
        <label
          style={{
            backgroundColor: "#ffffdd",
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #0001",
          }}
        >
          هذا البند الخاص بأرقام الحسابات البنكية للطرفين
        </label>
      )}
      <FormControl
        className="mb-3 border"
        name={`title${i + 1}`}
        placeholder={`ادخل عنوان البند - ${i + 1}`}
        type="text"
        value={formState[`title${i + 1}`]}
        onChange={handleChange}
      />
      <FormControl
        as="textarea"
        name={`item${i + 1}`}
        rows={4}
        placeholder={`ادخل محتوى البند - ${i + 1}`}
        value={formState[`item${i + 1}`]}
        onChange={handleChange}
      />
    </FormGroup>
  );
};
