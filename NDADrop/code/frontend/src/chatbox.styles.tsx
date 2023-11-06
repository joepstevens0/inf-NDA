import styled from "styled-components";

export const Wrapper =styled.div`
    overflow-y: hidden;
    height: 90%;
    width: 65%;
    border: 1px solid black;
    float: right;
    overflow-x: hidden;
    background-color: #EDEDED;
    margin: 5px;

    h2{
        padding: 10px;
        align-items: center;
    }

    hr{
        padding: 0px;
        margin-left: 5px;
        margin-right: 5px;
        background-color: black;
        height: 2px;

    }

`;

export const Button = styled.button`
    border-radius: 5px;
    border: none;
    background-color: #0084ff;
    color: #ffffff;
    float: left;
    margin: 5px;
    clear: both;
    font-size: 16px;
    padding: 3px;
`;

export const TextArea = styled.textarea`
    width: 95%;
    height: 40px;
    border-radius: 5px;
    border: 1px solid black;
    float: left;
    margin: 5px;
    font-size: 16px;


`;

export const MessageWrapper = styled.div`
    height: 80%;
    padding: 5px;
    font-size: 16px;
    overflow-y: auto;


`;

export const Message = styled.div`
    display: flex;
    align-items: center;

    p {
        padding-left: 4px;
        padding-right: 4px;
        font-size: 16px;

    }

    .bold{
        font-weight: bold;
    }

    .send{
        background-Color: "white";
        border-Radius: "10px"; 
        padding-Left: "5px";
    }

`;
