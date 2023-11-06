import styled from "styled-components";


export const Wrapper = styled.div`
    border: 1px solid black;
    margin-left: 25px;
    margin-bottom: 10px;
    padding: 10px;
    width: 375px;
    border-radius: 5px;
h4{
    text-align: center;
}

Button{
    border: 1px solid black;
    margin-bottom: 5px;
    margin-top: 5px;
}

Select{
    width: 200px;
}
`;

export const MessageDiv = styled.div`
    padding-left: 5px;
    overflow-y: scroll;
    max-height: 250px;
    overflow-wrap: break-word;
    border: 1px solid black;
    border-radius: 5px;
`;

export const CopieDiv = styled.div`
    padding-left: 5px;
    overflow-y: scroll;
    max-height: 250px;
    overflow-wrap: break-word;
    border: 1px solid black;
    border-radius: 5px;
`;


export const NeighbourSelectDiv = styled.div`
    text-align: center;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
`;

export const SendMsgDiv = styled.div`
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    margin-top: 5px;
    margin-bottom: 5px;
    padding-top: 5px;
    padding-bottom: 5px;

Button{
    margin-left: 20px;
    padding: 10px;
}

`;


export const StatusDiv =  styled.div`
    text-align: center;

`;



export const FlexMultiVal = styled.div`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    padding-right: 5px;
.left{
    font-weight: bold;
    margin-top: 5px;
    margin-bottom: 5px;
}

.right{
    
    margin-top: 5px;
    margin-bottom: 5px;
    padding-right: 20px;
}

.keyWords{
    font-weight: bold;
    margin-top: 5px;
    margin-bottom: 5px;
}

.value{
    margin-top: 5px;
    margin-bottom: 5px;
}
`;


export const Flexfordiv = styled.div`
    display: flex;
    justify-content: flex-start;

.left{
    flex-basis: 30%;
    font-weight: bold;
    margin-top: 5px;
    margin-bottom: 5px;
}

.right{
    flex-basis: 55%;
    margin-top: 5px;
    margin-bottom: 5px;
    padding-right: 20px;
}
`;
